/*************************************************
    Attributes:
 *************************************************/
PointLoader.prototype.controller;
PointLoader.prototype.fileController;
PointLoader.prototype.textureLayer;
PointLoader.prototype.pointLayer;
PointLoader.prototype.selectorData;
PointLoader.prototype.displayedData;

PointLoader.prototype.texHeight = 128;
PointLoader.prototype.texWidth = 128;
PointLoader.prototype.colorTexHeight = 16;

PointLoader.prototype.pi_180 = Math.PI / 180.0;
PointLoader.prototype.pi_4 = Math.PI * 4;

/*************************************************
    Constructors:
 *************************************************/
function PointLoader(rootNode, map) {
    var self = this;
    self.displayedData = d3.map();
    self.textureLayer = new GoogleMapCanvasLayerTexture(map, "shader/texture.vert", "shader/texture.frag", function() {
        self.pointLayer = new GoogleMapCanvasLayerPoints(map, "shader/point.vert", "shader/point.frag", function() {
            self.ready(self, rootNode);
        });
    });
}

/*************************************************
    Methods:
 *************************************************/

PointLoader.prototype.ready = function(self, rootNode) {
    d3.csv('data/tmp/FunctDay1_csv/index.csv', function(error, data) {
        if (error != null) {
            console.warn(error);
        } else {
            self.selectorData = data;
            if (self.selectorData != null) {
                self.fileController = new MapController("Files", self);
                self.fileController.extractData = self.extractData;
                self.fileController.extractTitle = self.extractTitle;
                self.fileController.extractTag = self.extractTag;
                self.fileController.init(rootNode);
                self.controller = new PointController(self, rootNode, []);
            }
        }
    });
}

PointLoader.prototype.LatLongToPixelXY = function(latitude, longitude) {
    var sinLatitude = Math.sin(latitude * this.pi_180);
    var pixelY = (0.5 - Math.log((1 + sinLatitude) / (1 - sinLatitude)) / (this.pi_4)) * 256;
    var pixelX = ((longitude + 180) / 360) * 256;
    var pixel = {
        x: pixelX,
        y: pixelY
    };
    return pixel;
}

PointLoader.prototype.showPoints = function(self, data) {
    self.showColorScale(self.pointLayer);
    var rawData = new Float32Array(3 * data.length);
    var i = 0;
    data.forEach(function(row) {
        var point = self.LatLongToPixelXY(parseFloat(row.latitude), parseFloat(row.longitude));
        rawData[0 + i * 3] = point.x;
        rawData[1 + i * 3] = point.y;
        rawData[2 + i * 3] = parseFloat(row.pointValue) / 100.0;
        ++i;
    });
    self.pointLayer.refreshPoints(rawData, 3);
}

PointLoader.prototype.showTexture = function(self, data) {
    self.showColorScale(self.textureLayer);
    var dimension = {
        width: self.texWidth,
        height: self.texHeight,
    }
    var boundingBox = self.extractBoundingbox(data);
    var buffer = self.extractDataBuffer(boundingBox, dimension, data);
    self.textureLayer.refreshTexture(boundingBox, dimension, 2, buffer);
}

PointLoader.prototype.showColorScale = function(layer) {
    var self = this;
    var h = self.colorTexHeight;
    var colorScale = d3.scale.linear()
        .domain([0, h])
        .range(["#FF0000", "#00FF00"])
        .interpolate(d3.interpolateRgb);
    layer.bindColorScale(h, colorScale);
}

PointLoader.prototype.extractBoundingbox = function(data) {
    var self = this;
    var boundingBox = {
        minPoint: self.LatLongToPixelXY(
            d3.min(data, function(d) {
                return parseFloat(d.latitude);
            }),
            d3.min(data, function(d) {
                return parseFloat(d.longitude);
            })
        ),
        maxPoint: self.LatLongToPixelXY(
            d3.max(data, function(d) {
                return parseFloat(d.latitude);
            }),
            d3.max(data, function(d) {
                return parseFloat(d.longitude);
            })
        )
    }
    return boundingBox;
}

PointLoader.prototype.extractDataBuffer = function(bbox, dim, data) {
    var self = this;
    var width = dim.width;
    var height = dim.height;
    var buffer = new Uint8Array(width * height * 2);
    if (bbox != null) {
        // first pass: incrementally compute average values, using the alpha as counter
        data.forEach(function(row) {
            var point = self.LatLongToPixelXY(parseFloat(row.latitude), parseFloat(row.longitude));
            var x = Math.round((point.x - bbox.minPoint.x) * width / (bbox.maxPoint.x - bbox.minPoint.x));
            var y = Math.round((point.y - bbox.minPoint.y) * height / (bbox.maxPoint.y - bbox.minPoint.y));
            var value = Math.round((parseFloat(row.pointValue)) * 255.0 / 100.0);
            var index = x * 2 + y * self.texWidth * 2;
            var previousMean = buffer[index];
            var count = buffer[index + 1] + 1;

            if (count > 1) {
                buffer[index] = previousMean + ((value - previousMean) / count);
            } else {
                buffer[index] = value;
            }
            buffer[index + 1] = count;
        });
    }
    // second pass: reset all alpha to 255 (non transparent)
    for (var i = 0; i < (self.texWidth * self.texHeight); i += 2) {
        buffer[i + 1] = 255;
    }
    return buffer;
}





PointLoader.prototype.extractData = function(data) {
    return data.sort();
}

PointLoader.prototype.extractTitle = function(data) {
    return data.file;
}

PointLoader.prototype.extractTag = function(data) {
    return 'data/tmp/FunctDay1_csv/' + data.file;
}

PointLoader.prototype.getSelectorData = function() {
    return this.selectorData;
}

PointLoader.prototype.refreshMap = function() {
    var self = this;
    var rawData = [];
    self.displayedData.forEach(function(k, v) {
        rawData = rawData.concat(v);
    });
    self.controller.setRawData(rawData);
}

PointLoader.prototype.addDataToMap = function(self, elt) {
    d3.csv(elt.tag, function(error, data) {
        if (error != null) {
            console.warn(error);
        } else {
            self.displayedData.set(elt.tag, data);
            self.refreshMap();
        }
    });
}

PointLoader.prototype.removeDataFromMap = function(elt) {
    var self = this;
    self.displayedData.remove(elt.tag);
    self.refreshMap();
}