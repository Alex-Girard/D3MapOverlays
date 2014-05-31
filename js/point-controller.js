/*************************************************
    Attributes:
 *************************************************/
PointController.prototype.dataLoader;
PointController.prototype.textureLayer;
PointController.prototype.pointsLayer;
PointController.prototype.rawData;

PointController.prototype.texOptions = [4, 8, 16, 32, 64, 128, 256, 512, 1024, 2048, 4096];

/*************************************************
    Constructors:
 *************************************************/
function PointController(dataLoader, rootNode, data) {
    this.dataLoader = dataLoader;
    this.textureLayer = dataLoader.textureLayer;
    this.pointsLayer = dataLoader.pointLayer;
    this.rawData = data;
    this.init(rootNode);
}

/*************************************************
    Methods:
 *************************************************/

PointController.prototype.init = function(rootNode) {
    this.initPage(rootNode);
}

PointController.prototype.initPage = function(rootNode) {
    var self = this;
    d3.text("point.html", "text/plain", function(error, data) {
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
            var textureDimension = new SliderBrush("td.textureSlider", 7, [0, 9], [200, 42], margin, self.onNewTextureDimension());
            var scaleDimension = new SliderBrush("td.scaleSlider", 2, [0, 9], [200, 42], margin, self.onNewScaleDimension());

            $("input.textureCheckBox").on("change", self.onCheckBoxChange(self.dataLoader.showTexture));
            $("input.pointsCheckBox").on("change", self.onCheckBoxChange(self.dataLoader.showPoints));
        }
    });
}


PointController.prototype.setRawData = function(data) {
    var self = this;
    self.rawData = data;
    if ($("input.textureCheckBox").is(':checked')) {
        self.dataLoader.showTexture(self.dataLoader, self.rawData);
    }
    if ($("input.pointsCheckBox").is(':checked')) {
        self.dataLoader.showPoints(self.dataLoader, self.rawData);
    }
}

PointController.prototype.onCheckBoxChange = function(show) {
    var self = this;
    return function() {
        if ($(this).is(':checked')) {
            show(self.dataLoader, self.rawData);
        } else {
            show(self.dataLoader, []);
        }
    }
}

PointController.prototype.onNewTextureDimension = function() {
    var self = this;
    return function(value) {
        self.dataLoader.texHeight = self.texOptions[value];
        self.dataLoader.texWidth = self.texOptions[value];
        if ($("input.textureCheckBox").is(':checked')) {
            self.dataLoader.showTexture(self.dataLoader, self.rawData);
        }
    }
}

PointController.prototype.onNewScaleDimension = function() {
    var self = this;
    return function(value) {
        self.dataLoader.colorTexHeight = self.texOptions[value];
        if ($("input.textureCheckBox").is(':checked')) {
            self.dataLoader.showTexture(self.dataLoader, self.rawData);
        }
        if ($("input.pointsCheckBox").is(':checked')) {
            self.dataLoader.showPoints(self.dataLoader, self.rawData);
        }
    }
}