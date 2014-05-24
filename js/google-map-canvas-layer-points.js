/*************************************************
    Attributes:
 *************************************************/
GoogleMapCanvasLayer.prototype.map;
GoogleMapCanvasLayer.prototype.canvasLayer;
GoogleMapCanvasLayer.prototype.gl;

GoogleMapCanvasLayer.prototype.pointProgram;
GoogleMapCanvasLayer.prototype.pointArrayBuffer;

GoogleMapCanvasLayer.prototype.pi_180 = Math.PI / 180.0;
GoogleMapCanvasLayer.prototype.pi_4 = Math.PI * 4;

GoogleMapCanvasLayer.prototype.POINT_COUNT = 1000;
GoogleMapCanvasLayer.prototype.MIN_X = 37.658324;
GoogleMapCanvasLayer.prototype.MAX_X = 37.824495;
GoogleMapCanvasLayer.prototype.MIN_Y = -122.510896;
GoogleMapCanvasLayer.prototype.MAX_Y = -122.368257;

GoogleMapCanvasLayer.prototype.pixelsToWebGLMatrix = new Float32Array(16);
GoogleMapCanvasLayer.prototype.mapMatrix = new Float32Array(16);

/*************************************************
    Constructors:
 *************************************************/

function GoogleMapCanvasLayer(googleMapView, vertexFile, fragmentFile) {
    this.map = googleMapView.map;
    this.init(vertexFile, fragmentFile);
}

/*************************************************
    Methods:
 *************************************************/

GoogleMapCanvasLayer.prototype.init = function(vertexFile, fragmentFile) {
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

    this.createShaderProgram(vertexFile, fragmentFile);
}

GoogleMapCanvasLayer.prototype.LatLongToPixelXY = function(latitude, longitude) {
    var sinLatitude = Math.sin(latitude * this.pi_180);
    var pixelY = (0.5 - Math.log((1 + sinLatitude) / (1 - sinLatitude)) / (this.pi_4)) * 256;
    var pixelX = ((longitude + 180) / 360) * 256;

    var pixel = {
        x: pixelX,
        y: pixelY
    };

    return pixel;
}


GoogleMapCanvasLayer.prototype.createShaderProgram = function(vertexFile, fragmentFile) {
    var gl = this.gl;
    var self = this;
    var vertexShader;
    var fragmentShader;
    d3.text(vertexFile, "text/plain", function(error, data) {
        if (error != null) {
            console.warn(error);
        } else {
            vertexShader = gl.createShader(gl.VERTEX_SHADER);
            gl.shaderSource(vertexShader, data);
            gl.compileShader(vertexShader);
        }

        d3.text(fragmentFile, "text/plain", function(error, data) {
            if (error != null) {
                console.warn(error);
            } else {
                fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
                gl.shaderSource(fragmentShader, data);
                gl.compileShader(fragmentShader);

                // link shaders to create our program
                self.pointProgram = gl.createProgram();
                gl.attachShader(self.pointProgram, vertexShader);
                gl.attachShader(self.pointProgram, fragmentShader);
                gl.linkProgram(self.pointProgram);
                gl.useProgram(self.pointProgram);

                self.loadDataPoints();
            }
        });
    });
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

GoogleMapCanvasLayer.prototype.loadDataPoints = function() {
    var gl = this.gl;
    var self = this;

    d3.csv('data/food_inspection.csv', function(error, data) {
        if (error != null) {
            console.warn(error);
        } else {
            self.POINT_COUNT = data.length;
            var rawData = new Float32Array(2 * self.POINT_COUNT);
            for (var i = 0, j = 0; i < rawData.length; i += 2, ++j) {
                var row = data[j];
                var point = self.LatLongToPixelXY(parseFloat(row.latitude), parseFloat(row.longitude));
                rawData[i] = point.x;
                rawData[i + 1] = point.y;
            }
            // create webgl buffer, bind it, and load rawData into it
            self.pointArrayBuffer = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, self.pointArrayBuffer);
            gl.bufferData(gl.ARRAY_BUFFER, rawData, gl.STATIC_DRAW);

            // enable the 'worldCoord' attribute in the shader to receive buffer
            var attributeLoc = gl.getAttribLocation(self.pointProgram, 'worldCoord');
            gl.enableVertexAttribArray(attributeLoc);

            // tell webgl how buffer is laid out (pairs of x,y coords)
            gl.vertexAttribPointer(attributeLoc, 2, gl.FLOAT, false, 0, 0);
        }
    });
}