/*************************************************
    Attributes:
 *************************************************/
RestaurantController.prototype.dataLoader;
RestaurantController.prototype.rawData;

/*************************************************
    Constructors:
 *************************************************/
function RestaurantController(dataLoader, rootNode, data) {
    this.dataLoader = dataLoader;
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