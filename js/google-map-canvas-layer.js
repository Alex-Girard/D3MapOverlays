/*************************************************
    Attributes:
 *************************************************/
GoogleMapCanvasLayer.prototype.map;
GoogleMapCanvasLayer.prototype.canvasLayer;
GoogleMapCanvasLayer.prototype.gl;

GoogleMapCanvasLayer.prototype.pointProgram;
GoogleMapCanvasLayer.prototype.pointArrayBuffer;
GoogleMapCanvasLayer.prototype.POINT_COUNT = 42;


GoogleMapCanvasLayer.prototype.MIN_X = 37.65;
GoogleMapCanvasLayer.prototype.MAX_X = 37.809;
GoogleMapCanvasLayer.prototype.MIN_Y = -122.52;
GoogleMapCanvasLayer.prototype.MAX_Y = -122.35;

GoogleMapCanvasLayer.prototype.pixelsToWebGLMatrix = new Float32Array(16);
GoogleMapCanvasLayer.prototype.mapMatrix = new Float32Array(16);

/*************************************************
    Constructors:
 *************************************************/

function GoogleMapCanvasLayer(googleMapView) {
    this.map = googleMapView.map;
    this.init();
}

/*************************************************
    Methods:
 *************************************************/

GoogleMapCanvasLayer.prototype.init = function() {
    var canvasLayerOptions = {
        map: this.map,
        resizeHandler: this.resize(this),
        animate: false,
        updateHandler: this.update(this),
        mapCanvas: this,
    };
    this.canvasLayer = new CanvasLayer(canvasLayerOptions);
    // initialize WebGL
    this.gl = this.canvasLayer.canvas.getContext('experimental-webgl');

    this.createShaderProgram();
    this.loadData();
}


GoogleMapCanvasLayer.prototype.loadData = function() {
    var gl = this.gl;
    // this data could be loaded from anywhere, but in this case we'll
    // generate some random x,y coords in a world coordinate bounding box
    var rawData = new Float32Array(2 * this.POINT_COUNT);
    for (var i = 0; i < rawData.length; i += 2) {
        var point = LatLongToPixelXY(this.lerp(this.MIN_X, this.MAX_X, Math.random()),
            this.lerp(this.MIN_Y, this.MAX_Y, Math.random()));
        rawData[i] = point.x;
        rawData[i + 1] = point.y;
    }

    // create webgl buffer, bind it, and load rawData into it
    this.pointArrayBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.pointArrayBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, rawData, gl.STATIC_DRAW);

    // enable the 'worldCoord' attribute in the shader to receive buffer
    var attributeLoc = gl.getAttribLocation(this.pointProgram, 'worldCoord');
    gl.enableVertexAttribArray(attributeLoc);

    // tell webgl how buffer is laid out (pairs of x,y coords)
    gl.vertexAttribPointer(attributeLoc, 2, gl.FLOAT, false, 0, 0);
}

// linear interpolate between a and b
GoogleMapCanvasLayer.prototype.lerp = function(a, b, t) {
    return a + t * (b - a);
}

var pi_180 = Math.PI / 180.0;
var pi_4 = Math.PI * 4;

function LatLongToPixelXY(latitude, longitude) {

    var sinLatitude = Math.sin(latitude * pi_180);
    var pixelY = (0.5 - Math.log((1 + sinLatitude) / (1 - sinLatitude)) / (pi_4)) * 256;
    var pixelX = ((longitude + 180) / 360) * 256;

    var pixel = {
        x: pixelX,
        y: pixelY
    };

    return pixel;
}


GoogleMapCanvasLayer.prototype.createShaderProgram = function() {
    var gl = this.gl;
    // create vertex shader
    var vertexSrc = document.getElementById('pointVertexShader').text;
    var vertexShader = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vertexShader, vertexSrc);
    gl.compileShader(vertexShader);

    // create fragment shader
    var fragmentSrc = document.getElementById('pointFragmentShader').text;
    var fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fragmentShader, fragmentSrc);
    gl.compileShader(fragmentShader);

    // link shaders to create our program
    this.pointProgram = gl.createProgram();
    gl.attachShader(this.pointProgram, vertexShader);
    gl.attachShader(this.pointProgram, fragmentShader);
    gl.linkProgram(this.pointProgram);

    gl.useProgram(this.pointProgram);
}

GoogleMapCanvasLayer.prototype.resize = function(self) {
    return function() {
        var width = this.canvas.width;
        var height = this.canvas.height;
        self.gl.viewport(0, 0, width, height);

        // matrix which maps pixel coordinates to WebGL coordinates
        self.pixelsToWebGLMatrix.set([2 / width, 0, 0, 0, 0, -2 / height, 0, 0,
            0, 0, 0, 0, -1, 1, 0, 1
        ]);
    }
}

GoogleMapCanvasLayer.prototype.scaleMatrix = function(matrix, scaleX, scaleY) {
    // scaling x and y, which is just scaling first two columns of matrix
    matrix[0] *= scaleX;
    matrix[1] *= scaleX;
    matrix[2] *= scaleX;
    matrix[3] *= scaleX;

    matrix[4] *= scaleY;
    matrix[5] *= scaleY;
    matrix[6] *= scaleY;
    matrix[7] *= scaleY;
}

GoogleMapCanvasLayer.prototype.translateMatrix = function(matrix, tx, ty) {
    // translation is in last column of matrix
    matrix[12] += matrix[0] * tx + matrix[4] * ty;
    matrix[13] += matrix[1] * tx + matrix[5] * ty;
    matrix[14] += matrix[2] * tx + matrix[6] * ty;
    matrix[15] += matrix[3] * tx + matrix[7] * ty;
}

GoogleMapCanvasLayer.prototype.update = function(self) {
    return function() {
        var gl = self.gl;
        gl.clear(gl.COLOR_BUFFER_BIT);

        var mapProjection = self.map.getProjection();

        /**
         * We need to create a transformation that takes world coordinate
         * points in the pointArrayBuffer to the coodinates WebGL expects.
         * 1. Start with second half in pixelsToWebGLMatrix, which takes pixel
         *     coordinates to WebGL coordinates.
         * 2. Scale and translate to take world coordinates to pixel coords
         * see https://developers.google.com/maps/documentation/javascript/maptypes#MapCoordinate
         */

        // copy pixel->webgl matrix
        self.mapMatrix.set(self.pixelsToWebGLMatrix);

        // Scale to current zoom (worldCoords * 2^zoom)
        var scale = Math.pow(2, self.map.zoom);
        self.scaleMatrix(self.mapMatrix, scale, scale);

        // translate to current view (vector from topLeft to 0,0)
        var offset = mapProjection.fromLatLngToPoint(self.canvasLayer.getTopLeft());
        self.translateMatrix(self.mapMatrix, -offset.x, -offset.y);

        // attach matrix value to 'mapMatrix' uniform in shader
        var matrixLoc = gl.getUniformLocation(self.pointProgram, 'mapMatrix');
        gl.uniformMatrix4fv(matrixLoc, false, self.mapMatrix);

        // draw!
        gl.drawArrays(gl.POINTS, 0, self.POINT_COUNT);
    }
}