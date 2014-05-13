/*************************************************
    Attributes:
 *************************************************/
GoogleMapView.prototype.center;
GoogleMapView.prototype.markerData;
GoogleMapView.prototype.map;
GoogleMapView.prototype.overlay;

/*************************************************
    Constructors:
 *************************************************/
function GoogleMapView(center) {
    if (center == null) {
        center = {
            'name': 'center',
            'group': 'POI',
            'pos': [37.8009, -122.43666],
            'color': "red"
        };
    }
    this.center = center;
    this.markerData = d3.map()
    this.markerData.set("POI", [center]);

    this.map = this.createMap();
    this.overlay = this.createOverlay();
}

/*************************************************
    Static functions:
 *************************************************/

/*************************************************
    Methods:
 *************************************************/
GoogleMapView.prototype.createMap = function() {
    var map = new google.maps.Map(d3.select("#google-map-view").node(), {
        zoom: 18,
        center: new google.maps.LatLng(this.center.pos[0], this.center.pos[1]),
        mapTypeId: google.maps.MapTypeId.ROADMAP
    });
    return map;
};

GoogleMapView.prototype.getMarkerData = function() {
    return this.markerData;
}

GoogleMapView.prototype.addMarkers = function(key, markers) {
    this.markerData.set(key, markers);
    this.overlay.draw();
}

GoogleMapView.prototype.removeMarkers = function(key) {
    this.markerData.remove(key);
    this.overlay.draw();
}

GoogleMapView.prototype.createOverlay = function(map) {
    var overlay = new google.maps.OverlayView();
    var markerData = this.getMarkerData();
    overlay.onAdd = function() {
        var layer = d3.select(this.getPanes().overlayLayer).append("div")
            .attr("class", "markers");

        // Draw each marker as a separate SVG element.
        overlay.draw = function() {
            var projection = this.getProjection(),
                padding = 10;
            var data = [];
            markerData.forEach(function(k, v) {
                data = data.concat(v);
            });
            var marker = layer.selectAll("svg")
                .data(data);
            marker.exit().remove();
            var newMarker = marker.each(transform)
                .enter().append("svg:svg")
                .each(transform)
                .attr("class", "marker");
            newMarker.append("svg:circle").attr({
                r: 4.5,
                cx: padding,
                cy: padding,
                fill: function(d) {
                    return d.color;
                }
            });

            function transform(d) {
                d = new google.maps.LatLng(d.pos[0], d.pos[1]);
                d = projection.fromLatLngToDivPixel(d);
                return d3.select(this)
                    .style("left", (d.x - padding) + "px")
                    .style("top", (d.y - padding) + "px");
            }
        };
    };
    overlay.setMap(this.map);
    return overlay;
}