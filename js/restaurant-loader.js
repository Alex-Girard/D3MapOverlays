/*************************************************
    Attributes:
 *************************************************/
RestaurantLoader.prototype.controller;
RestaurantLoader.prototype.textureLayer;
RestaurantLoader.prototype.pointLayer;
RestaurantLoader.prototype.rawData;

RestaurantLoader.prototype.texHeight = 128;
RestaurantLoader.prototype.texWidth = 128;
RestaurantLoader.prototype.colorTexHeight = 16;

RestaurantLoader.prototype.pi_180 = Math.PI / 180.0;
RestaurantLoader.prototype.pi_4 = Math.PI * 4;

/*************************************************
    Constructors:
 *************************************************/
function RestaurantLoader(rootNode, map) {
    var self = this;

    self.textureLayer = new GoogleMapCanvasLayerTexture(map, "shader/texture.vert", "shader/texture.frag", function() {
        self.pointLayer = new GoogleMapCanvasLayerPoints(map, "shader/point.vert", "shader/point.frag", function() {
            self.ready(self, rootNode);
        });
    });
}

/*************************************************
    Methods:
 *************************************************/

RestaurantLoader.prototype.ready = function(self, rootNode) {
    d3.csv('data/food_inspection.csv', function(error, data) {
        if (error != null) {
            console.warn(error);
        } else {
            self.rawData = data;
            self.controller = new RestaurantController(self, rootNode, data);
        }
    });
}

RestaurantLoader.prototype.LatLongToPixelXY = function(latitude, longitude) {
    var sinLatitude = Math.sin(latitude * this.pi_180);
    var pixelY = (0.5 - Math.log((1 + sinLatitude) / (1 - sinLatitude)) / (this.pi_4)) * 256;
    var pixelX = ((longitude + 180) / 360) * 256;
    var pixel = {
        x: pixelX,
        y: pixelY
    };
    return pixel;
}

RestaurantLoader.prototype.showPoints = function(self, data) {
    self.showColorScale(self.pointLayer);
    var rawData = new Float32Array(3 * data.length);
    var i = 0;
    data.forEach(function(row) {
        var point = self.LatLongToPixelXY(parseFloat(row.latitude), parseFloat(row.longitude));
        rawData[0 + i * 3] = point.x;
        rawData[1 + i * 3] = point.y;
        rawData[2 + i * 3] = parseFloat(row.total) / 100.0;
        ++i;
    });
    self.pointLayer.refreshPoints(rawData, 3);
}

RestaurantLoader.prototype.showTexture = function(self, data) {
    self.showColorScale(self.textureLayer);
    var dimension = {
        width: self.texWidth,
        height: self.texHeight,
    }
    var boundingBox = self.extractBoundingbox(data);
    var buffer = self.extractDataBuffer(boundingBox, dimension, data);
    self.textureLayer.refreshTexture(boundingBox, dimension, 2, buffer);
}

RestaurantLoader.prototype.showColorScale = function(layer) {
    var self = this;
    var h = self.colorTexHeight;
    var colorScale = d3.scale.linear()
        .domain([0, h * 0.25, h * 0.75, h])
        .range(["#FF0000", "#FFFF00", "#229900", "#00FF00"])
        .interpolate(d3.interpolateRgb);
    layer.bindColorScale(h, colorScale);
}

RestaurantLoader.prototype.extractBoundingbox = function(data) {
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

RestaurantLoader.prototype.extractDataBuffer = function(bbox, dim, data) {
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
            var value = Math.round((parseFloat(row.total)) * 255.0 / 100.0);
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