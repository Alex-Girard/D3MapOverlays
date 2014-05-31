/*************************************************
    Attributes:
 *************************************************/
PointController.prototype.dataLoader;
PointController.prototype.textureLayer;
PointController.prototype.pointsLayer;
PointController.prototype.rawData;
PointController.prototype.daySlider;

PointController.prototype.texOptions = [4, 8, 16, 32, 64, 128, 256, 512, 1024, 2048];
PointController.prototype.pointSizeOptions = [0.1, 0.2, 0.5, 0.7, 1.0, 1.5, 2.0, 3.0, 5.0, 7.0];
PointController.prototype.dataDirOptions = ['data/tmp/FunctDay1_csv/', 'data/tmp/FunctDay3_csv/', 'data/tmp/FunctDay7_csv/', 'data/tmp/FunctDay14_csv/'];

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
            var textureDimension = new SliderBrush("td.textureSlider", 7, [0, self.texOptions.length - 1], [200, 42], margin, self.onNewTextureDimension());
            var scaleDimension = new SliderBrush("td.scaleSlider", 2, [0, self.texOptions.length - 1], [200, 42], margin, self.onNewScaleDimension());
            var pointSize = new SliderBrush("td.pointSlider", 2, [0, self.pointSizeOptions.length - 1], [200, 42], margin, self.onNewPointSize());
            self.daySlider = new SliderBrush("td.daySlider", 0, [0, self.dataDirOptions.length - 1], [200, 42], margin, self.onNewDay());

            self.initKeyPress();

            $("input.textureCheckBox").on("change", self.onCheckBoxChange(self.dataLoader.showTexture));
            $("input.pointsCheckBox").on("change", self.onCheckBoxChange(self.dataLoader.showPoints));
        }
    });
}

PointController.prototype.initKeyPress = function() {
    var self = this;
    document.onkeydown = checkKey;

    function checkKey(e) {

        e = e || window.event;

        if (e.keyCode == '39') {
            self.daySlider.incValue(self.daySlider);
        } else if (e.keyCode == '37') {
            self.daySlider.decValue(self.daySlider);
        } else if (e.keyCode == '78') {
            self.daySlider.incValue(self.daySlider);
        } else if (e.keyCode == '66') {
            self.daySlider.decValue(self.daySlider);
        }
    }
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

PointController.prototype.onNewPointSize = function() {
    var self = this;
    return function(value) {
        self.dataLoader.pointSize = self.pointSizeOptions[value];
        if ($("input.pointsCheckBox").is(':checked')) {
            self.dataLoader.showPoints(self.dataLoader, self.rawData);
        }
    }
}

PointController.prototype.onNewDay = function() {
    var self = this;
    return function(value) {
        self.dataLoader.reloadDataToMap(self.dataLoader, self.dataDirOptions[value]);
        if ($("input.textureCheckBox").is(':checked')) {
            self.dataLoader.showTexture(self.dataLoader, self.rawData);
        }
        if ($("input.pointsCheckBox").is(':checked')) {
            self.dataLoader.showPoints(self.dataLoader, self.rawData);
        }
    }
}