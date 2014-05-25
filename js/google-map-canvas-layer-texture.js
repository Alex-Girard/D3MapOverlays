/*************************************************
    Attributes:
 *************************************************/
GoogleMapCanvasLayerTexture.prototype.map;
GoogleMapCanvasLayerTexture.prototype.canvasLayer;
GoogleMapCanvasLayerTexture.prototype.gl;
GoogleMapCanvasLayerTexture.prototype.rawData;

GoogleMapCanvasLayerTexture.prototype.pointProgram;
GoogleMapCanvasLayerTexture.prototype.pointArrayBuffer;
GoogleMapCanvasLayerTexture.prototype.textureArrayBuffer;

GoogleMapCanvasLayerTexture.prototype.minPoint;
GoogleMapCanvasLayerTexture.prototype.maxPoint;

GoogleMapCanvasLayerTexture.prototype.texHeight = 256;
GoogleMapCanvasLayerTexture.prototype.texWidth = 256;
GoogleMapCanvasLayerTexture.prototype.colorTexHeight = 16;

GoogleMapCanvasLayerTexture.prototype.pixelsToWebGLMatrix = new Float32Array(16);
GoogleMapCanvasLayerTexture.prototype.mapMatrix = new Float32Array(16);

GoogleMapCanvasLayerTexture.prototype.pi_180 = Math.PI / 180.0;
GoogleMapCanvasLayerTexture.prototype.pi_4 = Math.PI * 4;

/*************************************************
    Constructors:
 *************************************************/

function GoogleMapCanvasLayerTexture(googleMapView, vertexFile, fragmentFile) {
    this.map = googleMapView.map;
    this.init(vertexFile, fragmentFile);
}

/*************************************************
    Methods:
 *************************************************/

GoogleMapCanvasLayerTexture.prototype.init = function(vertexFile, fragmentFile) {
    var canvasLayerOptions = {
        map: this.map,
        resizeHandler: this.resize(this),
        animate: false,
        updateHandler: this.update(this),
        mapCanvas: this,
    };
    this.canvasLayer = new CanvasLayer(canvasLayerOptions);
    // initialize WebGL
    try {
        this.gl = this.canvasLayer.canvas.getContext('webgl') ||
            this.canvasLayer.canvas.getContext('experimental-webgl');
        this.createShaderProgram(vertexFile, fragmentFile);
    } catch (e) {}

    // If we don't have a GL context, give up now
    if (!this.gl) {
        alert("Unable to initialize WebGL. Your browser may not support it.");
        this.gl = null;
    }
}

GoogleMapCanvasLayerTexture.prototype.LatLongToPixelXY = function(latitude, longitude) {
    var sinLatitude = Math.sin(latitude * this.pi_180);
    var pixelY = (0.5 - Math.log((1 + sinLatitude) / (1 - sinLatitude)) / (this.pi_4)) * 256;
    var pixelX = ((longitude + 180) / 360) * 256;
    var pixel = {
        x: pixelX,
        y: pixelY
    };
    return pixel;
}


GoogleMapCanvasLayerTexture.prototype.createShaderProgram = function(vertexFile, fragmentFile) {
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

            if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
                console.error(gl.getShaderInfoLog(vertexShader));
            }
        }

        d3.text(fragmentFile, "text/plain", function(error, data) {
            if (error != null) {
                console.warn(error);
            } else {
                fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
                gl.shaderSource(fragmentShader, data);
                gl.compileShader(fragmentShader);

                if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
                    console.error(gl.getShaderInfoLog(fragmentShader));
                }

                // link shaders to create our program
                self.pointProgram = gl.createProgram();
                gl.attachShader(self.pointProgram, vertexShader);
                gl.attachShader(self.pointProgram, fragmentShader);
                gl.linkProgram(self.pointProgram);

                if (!gl.getProgramParameter(self.pointProgram, gl.LINK_STATUS)) {
                    alert("Unable to initialize the shader program.");
                }

                gl.useProgram(self.pointProgram);

                self.loadDataTexture();
            }
        });
    });
}

GoogleMapCanvasLayerTexture.prototype.resize = function(self) {
    return function() {
        var width = this.canvas.width;
        var height = this.canvas.height;
        self.gl.viewport(0, 0, width, height);

        // matrix which maps pixel coordinates to WebGL coordinates
        self.pixelsToWebGLMatrix.set([
            2 / width, 0, 0, 0,
            0, -2 / height, 0, 0,
            0, 0, 0, 0, -1, 1, 0, 1
        ]);
    }
}

GoogleMapCanvasLayerTexture.prototype.scaleMatrix = function(matrix, scaleX, scaleY) {
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

GoogleMapCanvasLayerTexture.prototype.translateMatrix = function(matrix, tx, ty) {
    // translation is in last column of matrix
    matrix[12] += matrix[0] * tx + matrix[4] * ty;
    matrix[13] += matrix[1] * tx + matrix[5] * ty;
    matrix[14] += matrix[2] * tx + matrix[6] * ty;
    matrix[15] += matrix[3] * tx + matrix[7] * ty;
}

GoogleMapCanvasLayerTexture.prototype.update = function(self) {
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
        if (self.rawData != null) {
            gl.drawArrays(gl.TRIANGLE_STRIP, 0, 6);
        }
    }
}

GoogleMapCanvasLayerTexture.prototype.loadDataTexture = function() {
    var gl = this.gl;
    var self = this;

    d3.csv('data/food_inspection.csv', function(error, data) {
        if (error != null) {
            console.warn(error);
        } else {
            self.rawData = data;
            self.extractBoundingbox();
            self.bindColorScale();
            self.refreshTexture(self);
        }
    });
}

GoogleMapCanvasLayerTexture.prototype.extractBoundingbox = function() {
    var self = this;
    var data = self.rawData;
    self.minPoint = self.LatLongToPixelXY(
        d3.min(data, function(d) {
            return parseFloat(d.latitude);
        }),
        d3.min(data, function(d) {
            return parseFloat(d.longitude);
        })
    );
    self.maxPoint = self.LatLongToPixelXY(
        d3.max(data, function(d) {
            return parseFloat(d.latitude);
        }),
        d3.max(data, function(d) {
            return parseFloat(d.longitude);
        })
    );
}

GoogleMapCanvasLayerTexture.prototype.bindColorScale = function() {
    var gl = this.gl;
    var width = 4.0;
    var height = this.colorTexHeight;

    var colorScale = d3.scale.linear()
        .domain([0, height * 0.25, height * 0.75, height])
        .range(["#FF0000", "#992200", "#229900", "#00FF00"])
        .interpolate(d3.interpolateRgb);

    var texture = gl.createTexture();
    var type = gl.RGBA;
    var colorData = new Uint8Array(width * height * 4);
    for (var i = 0; i < width; ++i) {
        for (var j = 0; j < height; ++j) {
            color = d3.rgb(colorScale(j * 4));
            colorData[0 + j * 4 + i * 4 * height] = color.r;
            colorData[1 + j * 4 + i * 4 * height] = color.g;
            colorData[2 + j * 4 + i * 4 * height] = color.b;
            colorData[3 + j * 4 + i * 4 * height] = 255;
        }
    }
    // pass texture containing the data
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    // gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
    gl.texImage2D(gl.TEXTURE_2D, 0, type, width, height, 0, type, gl.UNSIGNED_BYTE, colorData);

    // or gl.NEAREST ?
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    gl.uniform1i(gl.getUniformLocation(this.pointProgram, "uColorScale"), 1);
}

GoogleMapCanvasLayerTexture.prototype.extractDataBuffer = function(data) {
    var self = this;
    var width = self.texWidth;
    var height = self.texHeight;
    var buffer = new Uint8Array(width * height);

    data.forEach(function(row) {
        var point = self.LatLongToPixelXY(parseFloat(row.latitude), parseFloat(row.longitude));
        var x = Math.floor((point.x - self.minPoint.x) * width / (self.maxPoint.x - self.minPoint.x));
        var y = Math.floor((point.y - self.minPoint.y) * height / (self.maxPoint.y - self.minPoint.y));
        buffer[x + y * self.texWidth] = (30 + parseFloat(row.total)) * 255.0 / 130.0;
    });
    return buffer;
}

GoogleMapCanvasLayerTexture.prototype.refreshTexture = function(self) {
    var gl = this.gl;
    var data = self.rawData;
    var texture = gl.createTexture();
    var type = gl.LUMINANCE;
    var width = self.texWidth;
    var height = self.texHeight;
    var buffer = self.extractDataBuffer(data);

    // pass texture containing the data
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
    gl.texImage2D(gl.TEXTURE_2D, 0, type, width, height, 0, type, gl.UNSIGNED_BYTE, buffer);

    // or gl.NEAREST ?
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    gl.uniform1i(gl.getUniformLocation(self.pointProgram, "uSampler"), 0);

    // pointArrayBuffer contains the world position of the bounding box(2 triangles)
    var worldCoord = new Float32Array(12);
    worldCoord[0] = self.minPoint.x;
    worldCoord[1] = self.minPoint.y;
    worldCoord[2] = self.maxPoint.x;
    worldCoord[3] = self.minPoint.y;
    worldCoord[4] = self.minPoint.x;
    worldCoord[5] = self.maxPoint.y;

    worldCoord[6] = self.minPoint.x;
    worldCoord[7] = self.maxPoint.y;
    worldCoord[8] = self.maxPoint.x;
    worldCoord[9] = self.minPoint.y;
    worldCoord[10] = self.maxPoint.x;
    worldCoord[11] = self.maxPoint.y;

    self.pointArrayBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, self.pointArrayBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, worldCoord, gl.STATIC_DRAW);
    var attributeLoc = gl.getAttribLocation(self.pointProgram, 'worldCoord');
    gl.enableVertexAttribArray(attributeLoc);
    gl.vertexAttribPointer(attributeLoc, 2, gl.FLOAT, false, 0, 0);

    // textureArraybuffer contains the texture position of the bounding box
    var texCoord = new Float32Array(12);
    texCoord[0] = 0.0;
    texCoord[1] = 0.0;
    texCoord[2] = 1.0;
    texCoord[3] = 0.0;
    texCoord[4] = 0.0;
    texCoord[5] = 1.0;

    texCoord[6] = 0.0;
    texCoord[7] = 1.0;
    texCoord[8] = 1.0;
    texCoord[9] = 0.0;
    texCoord[10] = 1.0;
    texCoord[11] = 1.0;

    self.textureArrayBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, self.textureArrayBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, texCoord, gl.STATIC_DRAW);
    var textureLoc = gl.getAttribLocation(self.pointProgram, 'textureCoord');
    gl.enableVertexAttribArray(textureLoc);
    gl.vertexAttribPointer(textureLoc, 2, gl.FLOAT, false, 0, 0);

    var textureSizeLocation = gl.getUniformLocation(self.pointProgram, "uTextureSize");
    gl.uniform2f(textureSizeLocation, width, height);
}