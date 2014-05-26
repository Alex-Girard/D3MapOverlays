/*************************************************
    Attributes:
 *************************************************/
RestaurantController.prototype.dataLoader;
RestaurantController.prototype.textureLayer;
RestaurantController.prototype.pointsLayer;
RestaurantController.prototype.rawData;

RestaurantController.prototype.texOptions = [4, 8, 16, 32, 64, 128, 256, 512, 1024, 2048];

/*************************************************
    Constructors:
 *************************************************/
function RestaurantController(dataLoader, rootNode, data) {
    this.dataLoader = dataLoader;
    this.textureLayer = dataLoader.textureLayer;
    this.pointsLayer = dataLoader.pointLayer;
    this.rawData = data;
    this.init(rootNode);
}

/*************************************************
    Methods:
 *************************************************/

RestaurantController.prototype.init = function(rootNode) {
    this.initPage(rootNode);
}

RestaurantController.prototype.initPage = function(rootNode) {
    var self = this;
    d3.text("restaurant.html", "text/plain", function(error, data) {
        if (error != null) {
            console.warn(error);
        } else {
            $(rootNode).append(data);
            var margin = {
                top: 5,
                right: 10,
                bottom: 5,
                left: 10,
            };
            var textureDimension = new SliderBrush("td.textureSlider", 6, [0, 9], [200, 42], margin, self.onNewTextureDimension());
            var scaleDimension = new SliderBrush("td.scaleSlider", 2, [0, 9], [200, 42], margin, self.onNewScaleDimension());

            $("input.textureCheckBox").on("change", self.onCheckBoxChange(self.dataLoader.showTexture));
            $("input.pointsCheckBox").on("change", self.onCheckBoxChange(self.dataLoader.showPoints));
        }
    });
}

RestaurantController.prototype.onCheckBoxChange = function(show) {
    var self = this;
    return function() {
        if ($(this).is(':checked')) {
            show(self.dataLoader, self.rawData);
        } else {
            show(self.dataLoader, []);
        }
    }
}

RestaurantController.prototype.onNewTextureDimension = function() {
    var self = this;
    return function(value) {
        self.textureLayer.texHeight = self.texOptions[value];
        self.textureLayer.texWidth = self.texOptions[value];
        if ($("input.textureCheckBox").is(':checked')) {
            self.dataLoader.showTexture(self.dataLoader, self.rawData);
        }
    }
}

RestaurantController.prototype.onNewScaleDimension = function() {
    var self = this;
    return function(value) {
        self.textureLayer.colorTexHeight = self.texOptions[value];
        if ($("input.textureCheckBox").is(':checked')) {
            self.dataLoader.showTexture(self.dataLoader, self.rawData);
        }
    }
}