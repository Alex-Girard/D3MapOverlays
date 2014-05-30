/*************************************************
    Attributes:
 *************************************************/
JsonPathLoader.prototype.selectorData;
JsonPathLoader.prototype.map;

/*************************************************
    Constructors:
 *************************************************/
function JsonPathLoader(filename, selectionFieldName) {
    var self = this;
    return function(rootNode, map) {
        self.map = map;
        d3.json(filename, function(error, data) {
            if (error != null) {
                console.warn(error);
            } else {
                var selectorFieldContainer = Object.keys(data.objects)[0];
                self.selectorData = d3.map();
                var features = topojson.feature(data,
                    data.objects[selectorFieldContainer]).features;
                self.selectorData.set('All', features);
                var keys = d3.set();
                features.forEach(function(d) {
                    if (d.properties.hasOwnProperty(selectionFieldName)) {
                        self.selectorData.set(d.properties[selectionFieldName], [d]);
                    } else {
                        Object.keys(d.properties).forEach(function(key) {
                            keys.add(key);
                        });
                    }
                });
                if (self.selectorData.size() > 0) {
                    var name = selectorFieldContainer + '_' + selectionFieldName;
                    name = name.replace('.', '_');
                    controller = new MapController(name, self);
                    controller.extractData = self.extractData;
                    controller.extractTitle = self.extractTitle;
                    controller.extractTag = self.extractTitle;
                    controller.init(rootNode);
                }
                if (keys.size() > 0) {
                    console.log(data);
                    console.log('"' + selectorFieldContainer + '" does not have a property named "' + selectionFieldName + '", available choices are:');
                    console.log(keys.values());
                }
            }
        });
    }
}

/*************************************************
    Methods:
 *************************************************/

JsonPathLoader.prototype.extractData = function(data) {
    return data.keys().sort();
}

JsonPathLoader.prototype.extractTitle = function(data) {
    return data;
}

JsonPathLoader.prototype.getSelectorData = function() {
    return this.selectorData;
}

JsonPathLoader.prototype.addDataToMap = function(self, elt) {
    var data = self.selectorData.get(elt.tag);
    data.forEach(function(d) {
        d.properties.color = elt.color;
    })
    this.map.addPathData(elt.tag, data);
}

JsonPathLoader.prototype.removeDataFromMap = function(elt) {
    this.map.removePathData(elt.tag);
}