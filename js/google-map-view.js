/*************************************************
    Attributes:
 *************************************************/
GoogleMapView.prototype.googleOpt;
GoogleMapView.prototype.map;
GoogleMapView.prototype.overlay;
GoogleMapView.prototype.svg;
GoogleMapView.prototype.contourData;
GoogleMapView.prototype.markerData;

/*************************************************
    Constructors:
 *************************************************/
function GoogleMapView(rootNode, center) {
    if (center == null) {
        center = {
            'name': 'center',
            'group': 'POI',
            'pos': [37.8009, -122.43666],
            'color': "red"
        };
    }
    this.googleOpt = {
        zoom: 18,
        center: new google.maps.LatLng(center.pos[0], center.pos[1]),
        mapTypeId: google.maps.MapTypeId.ROADMAP
    };
    this.resetMarkerData();
    this.resetContourData();
    this.markerData.set("POI", [center]);
    this.init(this.googleOpt, rootNode);
}

/*************************************************
    Static functions:
 *************************************************/

/*************************************************
    Methods:
 *************************************************/

GoogleMapView.prototype.resetMarkerData = function() {
    this.markerData = d3.map();
    if (this.overlay != null) {
        this.overlay.draw();
    }
}

GoogleMapView.prototype.resetContourData = function() {
    this.contourData = d3.map();
    if (this.overlay != null) {
        this.overlay.draw();
    }
}

GoogleMapView.prototype.getMarkerData = function() {
    return this.markerData;
}

GoogleMapView.prototype.addMarkers = function(key, markers) {
    this.markerData.set(key, markers);
    if (this.overlay != null) {
        this.overlay.draw();
    }
}

GoogleMapView.prototype.removeMarkers = function(key) {
    this.markerData.remove(key);
    if (this.overlay != null) {
        this.overlay.draw();
    }
}

GoogleMapView.prototype.googleProjection = function(prj) {
    return function(latlng) {
        ret = toPixel(latlng);
        return [ret.x + 10000, ret.y + 10000];
    };
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
            self.drawContours(left, top);
            self.drawMarkers(left, top);
        };
    };
    self.overlay.setMap(self.map);
}

GoogleMapView.prototype.drawContours = function(left, top) {
    var self = this;
    if (self.contourData != null && self.contourData.size() > 0) {
        var projection = self.overlay.getProjection()
        var data = [];
        self.contourData.forEach(function(k, v) {
            data = data.concat(v);
        });
        var path = d3.geo.path().projection(self.googleProjection(projection));
        var contours = self.svg.selectAll("path")
            .data(data);
        contours.attr({
            d: path,
        });
        contours.enter().append("path").attr({
            d: path,
        });
    }
}


GoogleMapView.prototype.drawMarkers = function(left, top) {
    var self = this;
    if (self.markerData != null && self.markerData.size() > 0) {
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
                return 4.5 * zoomRatio;
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