/*************************************************
    Attributes:
 *************************************************/
DistrictLoader.prototype.selectorData;
DistrictLoader.prototype.map;

/*************************************************
    Constructors:
 *************************************************/
function DistrictLoader(rootNode, map) {
    var self = this;
    this.map = map;
    d3.json("data/districts-sf.json", function(error, data) {
        if (error != null) {
            console.warn(error);
        } else {
            self.selectorData = d3.map();
            var features = topojson.feature(data,
                data.objects.neighborhood).features;
            self.selectorData.set('All', features);
            features.forEach(function(d) {
                self.selectorData.set(d.properties.name, [d]);
            });
            if (self.selectorData.size() > 0) {
                controller = new MapController("District", self);
                controller.extractData = self.extractData;
                controller.extractTitle = self.extractTitle;
                controller.extractTag = self.extractTitle;
                controller.init(rootNode);
            }
        }
    });
}

/*************************************************
    Methods:
 *************************************************/

DistrictLoader.prototype.extractData = function(data) {
    return data.keys().sort();
}

DistrictLoader.prototype.extractTitle = function(data) {
    return data;
}

DistrictLoader.prototype.getSelectorData = function() {
    return this.selectorData;
}

DistrictLoader.prototype.addDataToMap = function(self, elt) {
    var data = self.selectorData.get(elt.tag);
    data.forEach(function(d) {
        d.properties.color = elt.color;
    })
    this.map.addPathData(elt.tag, data);
}

DistrictLoader.prototype.removeDataFromMap = function(elt) {
    this.map.removePathData(elt.tag);
}