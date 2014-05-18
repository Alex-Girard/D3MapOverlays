/*************************************************
    Attributes:
 *************************************************/
GoogleMapView.prototype.googleOpt;
GoogleMapView.prototype.map;
GoogleMapView.prototype.overlay;
GoogleMapView.prototype.svg;
GoogleMapView.prototype.pathData;
GoogleMapView.prototype.markerData;

/*************************************************
    Constructors:
 *************************************************/
function GoogleMapView(rootNode, center) {
    if (center == null) {
        center = {
            'name': 'center',
            'group': 'POI',
            'pos': [37, -122],
            'color': "red"
        };
    }
    this.googleOpt = {
        zoom: 12,
        center: new google.maps.LatLng(center.pos[0], center.pos[1]),
        mapTypeId: google.maps.MapTypeId.ROADMAP
    };
    this.resetMarkerData();
    this.resetPathData();
    // Display initial center on map
    // this.markerData.set("POI", [center]);
    this.init(this.googleOpt, rootNode);
}

/*************************************************
    Methods:
 *************************************************/

GoogleMapView.prototype.resetMarkerData = function() {
    this.markerData = d3.map();
    if (this.overlay != null) {
        this.overlay.draw();
    }
}

GoogleMapView.prototype.resetPathData = function() {
    this.pathData = d3.map();
    if (this.overlay != null) {
        this.overlay.draw();
    }
}

GoogleMapView.prototype.addMarkerData = function(key, markers) {
    this.markerData.set(key, markers);
    if (this.overlay != null) {
        this.overlay.draw();
    }
}

GoogleMapView.prototype.removeMarkerData = function(key) {
    this.markerData.remove(key);
    if (this.overlay != null) {
        this.overlay.draw();
    }
}

GoogleMapView.prototype.addPathData = function(key, contours) {
    this.pathData.set(key, contours);
    if (this.overlay != null) {
        this.overlay.draw();
    }
}

GoogleMapView.prototype.removePathData = function(key) {
    this.pathData.remove(key);
    if (this.overlay != null) {
        this.overlay.draw();
    }
}

GoogleMapView.prototype.toPixel = function(prj, latlng) {
    ret = prj.fromLatLngToDivPixel(new google.maps.LatLng(latlng[0], latlng[1]))
    return [ret.x, ret.y];
}

GoogleMapView.prototype.init = function(googleOpt, rootNode) {
    var self = this;
    var top = -10000;
    var left = -10000;
    var width = 20000;
    var height = 20000;
    self.map = new google.maps.Map(d3.select(rootNode).node(),
        self.googleOpt);
    self.overlay = new google.maps.OverlayView();

    self.overlay.onAdd = function() {
        self.svg = d3.select(this.getPanes().overlayLayer)
            .append("svg")
            .attr({
                id: "svgRoot",
            });
        self.overlay.draw = function() {
            self.svg.style({
                position: "absolute",
                top: top + "px",
                left: left + "px",
                width: width + "px",
                height: height + "px",
            });
            self.drawMarkerData(left, top);
            self.drawPathData(left, top);
        };
    };
    self.overlay.setMap(self.map);
}

GoogleMapView.prototype.googleMapProjection = function(prj) {
    return function(coordinates) {
        var googleCoordinates = new google.maps.LatLng(coordinates[1], coordinates[0]);
        var pixelCoordinates = prj.fromLatLngToDivPixel(googleCoordinates);
        return [pixelCoordinates.x + 10000, pixelCoordinates.y + 10000];
    }
}

GoogleMapView.prototype.drawPathData = function(left, top) {
    var self = this;
    if (self.pathData != null) {
        var projection = self.overlay.getProjection()
        var data = [];
        self.pathData.forEach(function(k, v) {
            data = data.concat(v);
        });

        var prj = self.googleMapProjection(projection);
        var path = d3.geo.path().projection(prj);
        var areas = self.svg.selectAll("path")
            .data(data);
        areas.exit().remove();
        self.updateSelectedPath(left, top, areas, path);
        self.updateSelectedPath(left, top, areas.enter().append("path"), path);
    }
}
GoogleMapView.prototype.updateSelectedPath = function(left, top, areas, path) {
    var self = this;
    areas.attr({
        d: path,
        class: "pathMarker",
        fill: function(d) {
            return d.properties.color;
        },
        stroke: function(d) {
            if (d.hasOwnProperty('stroke')) {
                return d.properties.stroke;
            }
            return d.properties.color;
        },
    });
}

GoogleMapView.prototype.drawMarkerData = function(left, top) {
    var self = this;
    if (self.markerData != null) {
        var data = [];
        self.markerData.forEach(function(k, v) {
            data = data.concat(v);
        });
        var markers = self.svg.selectAll("circle")
            .data(data);
        markers.exit().remove();
        self.updateSelectedMarker(left, top, markers);
        self.updateSelectedMarker(left, top, markers.enter().append("circle"));
    }
}

GoogleMapView.prototype.updateSelectedMarker = function(left, top, markers) {
    var self = this;
    var projection = self.overlay.getProjection()
    markers.attr({
        class: "circleMarker marker",
        r: function(d) {
            var zoomRatio = self.map.getZoom() / self.googleOpt.zoom;
            if (d.hasOwnProperty('radius')) {
                return d.radius * zoomRatio;
            } else {
                return 2 * zoomRatio;
            }
        },
        cx: function(d) {
            return self.toPixel(projection, d.pos)[0];
        },
        cy: function(d) {
            return self.toPixel(projection, d.pos)[1];
        },
        fill: function(d) {
            if (d.hasOwnProperty('color')) {
                return d.color;
            } else {
                return "black";
            }
        },
        transform: "translate(" + [-left, -top] + ")",
    });
}
