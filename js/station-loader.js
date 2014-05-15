/*************************************************
    Attributes:
 *************************************************/
StationLoader.prototype.selectorData;
StationLoader.prototype.map;

/*************************************************
    Constructors:
 *************************************************/
function StationLoader(rootNode, map) {
    var self = this;
    this.map = map;
    d3.xml("http://webservices.nextbus.com/service/publicXMLFeed?" +
        "command=routeList&a=sf-muni",
        "application/xml",
        function(error, data) {
            if (error != null) {
                console.log(error);
            } else {
                self.selectorData = data.documentElement.getElementsByTagName("route");
                if (self.selectorData != null) {
                    controller = new MapController(rootNode, "stations", self);
                }
            }
        });
}

/*************************************************
    Methods:
 *************************************************/

StationLoader.prototype.getSelectorData = function() {
    return this.selectorData;
}

StationLoader.prototype.addDataToMap = function(self, elt) {
    d3.xml("http://webservices.nextbus.com/service/publicXMLFeed?" +
        "command=routeConfig&a=sf-muni&r=" + elt.tag, "application/xml",
        function(error, data) {
            if (error != null) {
                console.log(error);
            }
            var stops = data.documentElement.getElementsByTagName("stop");
            var stations = [];
            for (i = 0; i < stops.length; ++i) {
                var stop = stops[i];
                if (stop.getAttribute("title") != null) {
                    stations.push({
                        group: elt.tag,
                        name: stop.getAttribute("title"),
                        pos: [stop.getAttribute("lat"), stop.getAttribute("lon")],
                        color: elt.color
                    });
                }
            }
            self.map.addMarkers(elt.tag, stations);
        });
}


StationLoader.prototype.removeDataFromMap = function(elt) {
    this.map.removeMarkers(elt.tag);
}