/*************************************************
    Attributes:
 *************************************************/
GoogleMapCanvasLayerTexture.prototype.map;
GoogleMapCanvasLayerTexture.prototype.canvasLayer;
GoogleMapCanvasLayerTexture.prototype.gl;

GoogleMapCanvasLayerTexture.prototype.pointProgram;

GoogleMapCanvasLayerTexture.prototype.pixelsToWebGLMatrix = new Float32Array(16);
GoogleMapCanvasLayerTexture.prototype.mapMatrix = new Float32Array(16);

GoogleMapCanvasLayerTexture.prototype.hasData;

/*************************************************
    Constructors:
 *************************************************/

function GoogleMapCanvasLayerTexture(googleMapView, vertexFile, fragmentFile, ready) {
    this.map = googleMapView.map;
    this.init(vertexFile, fragmentFile, ready);
}

/*************************************************
    Methods:
 *************************************************/

GoogleMapCanvasLayerTexture.prototype.init = function(vertexFile, fragmentFile, ready) {
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
        this.createShaderProgram(vertexFile, fragmentFile, ready);
    } catch (e) {}

    // If we don't have a GL context, give up now
    if (!this.gl) {
        alert("Unable to initialize WebGL. Your browser may not support it.");
        this.gl = null;
    }
}

GoogleMapCanvasLayerTexture.prototype.createShaderProgram = function(vertexFile, fragmentFile, ready) {
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
                    console.error("Unable to initialize the shader program.");
                    return;
                }

                gl.useProgram(self.pointProgram);

                if (ready != null) {
                    ready();
                }
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
         * points to the coodinates WebGL expects.
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

        if (self.hasData) {
            // draw!
            gl.drawArrays(gl.TRIANGLE_STRIP, 0, 6);
        }
    }
}

GoogleMapCanvasLayerTexture.prototype.bindColorScale = function(height, colorScale) {
    var gl = this.gl;
    var width = 4.0;

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
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    // gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
    gl.texImage2D(gl.TEXTURE_2D, 0, type, width, height, 0, type, gl.UNSIGNED_BYTE, colorData);

    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    gl.uniform1i(gl.getUniformLocation(this.pointProgram, "uColorScale"), 0);
}

GoogleMapCanvasLayerTexture.prototype.componentsToGLType = function(numComponents) {
    var mapping = {
        1: this.gl.LUMINANCE,
        2: this.gl.LUMINANCE_ALPHA,
        3: this.gl.RGB,
        4: this.gl.RGBA,
    };
    return mapping[numComponents];
}

GoogleMapCanvasLayerTexture.prototype.refreshTexture = function(bbox, dim, numComponents, buffer) {
    var self = this;
    var gl = self.gl;
    var texture = gl.createTexture();
    var type = self.componentsToGLType(numComponents);
    var width = dim.width;
    var height = dim.height;

    // pass texture containing the data
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
    gl.texImage2D(gl.TEXTURE_2D, 0, type, width, height, 0, type, gl.UNSIGNED_BYTE, buffer);

    // or gl.NEAREST ?
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    gl.uniform1i(gl.getUniformLocation(self.pointProgram, "uSampler"), 1);

    // world position of the texture's bounding box(2 triangles)
    var worldCoord = new Float32Array(12);
    if (bbox != null) {
        worldCoord[0] = bbox.minPoint.x;
        worldCoord[1] = bbox.minPoint.y;
        worldCoord[2] = bbox.maxPoint.x;
        worldCoord[3] = bbox.minPoint.y;
        worldCoord[4] = bbox.minPoint.x;
        worldCoord[5] = bbox.maxPoint.y;

        worldCoord[6] = bbox.minPoint.x;
        worldCoord[7] = bbox.maxPoint.y;
        worldCoord[8] = bbox.maxPoint.x;
        worldCoord[9] = bbox.minPoint.y;
        worldCoord[10] = bbox.maxPoint.x;
        worldCoord[11] = bbox.maxPoint.y;
        self.hasData = true;
    } else {
        self.hasData = false;
    }
    var pointArrayBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, pointArrayBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, worldCoord, gl.STATIC_DRAW);
    var attributeLoc = gl.getAttribLocation(self.pointProgram, 'worldCoord');
    gl.enableVertexAttribArray(attributeLoc);
    gl.vertexAttribPointer(attributeLoc, 2, gl.FLOAT, false, 0, 0);

    // texture position of the bounding box
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

    var textureArrayBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, textureArrayBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, texCoord, gl.STATIC_DRAW);
    var textureLoc = gl.getAttribLocation(self.pointProgram, 'textureCoord');
    gl.enableVertexAttribArray(textureLoc);
    gl.vertexAttribPointer(textureLoc, 2, gl.FLOAT, false, 0, 0);

    var textureSizeLocation = gl.getUniformLocation(self.pointProgram, "uTextureSize");
    gl.uniform2f(textureSizeLocation, width, height);

    self.update(self)();
}