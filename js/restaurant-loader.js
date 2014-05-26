/*************************************************
    Attributes:
 *************************************************/
RestaurantLoader.prototype.controller;
RestaurantLoader.prototype.textureLayer;
RestaurantLoader.prototype.pointLayer;
RestaurantLoader.prototype.rawData;

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

RestaurantLoader.prototype.showTexture = function(self, data) {
    self.textureLayer.refreshTexture(data);
}

RestaurantLoader.prototype.showPoints = function(self, data) {
    self.pointLayer.refreshPoints(data);
}