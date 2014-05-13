/*************************************************
    Attributes:
 *************************************************/
StationController.prototype.map;
StationController.prototype.selectedLines = d3.map();
var colorScale = d3.scale.category20();


/*************************************************
    Constructors:
 *************************************************/

function StationController(map) {
    this.map = map;
    this.initStationSelector();
    $("#muni-line-selector").bind('change', this, onStationSelection);
}

/*************************************************
    Static functions:
 *************************************************/

var onStationSelection = function(e) {
    var choice = $("option.muni-line-option[value='" + $(this).val() + "']");
    if (choice.length > 0) {
        var newLine = {
            tag: choice.attr('tag'),
            name: choice.attr('value'),
            color: colorScale(e.data.selectedLines.size())
        };
        e.data.onNewStation(newLine);
    }
    // reset the muni-line-list selector
    $("#muni-line-selector").selectpicker('deselectAll');
}

/*************************************************
    Methods:
 *************************************************/

StationController.prototype.submit = function() {

}

StationController.prototype.initStationSelector = function() {
    d3.xml("http://webservices.nextbus.com/service/publicXMLFeed?" +
        "command=routeList&a=sf-muni",
        "application/xml",
        function(error, data) {
            var lineSelector = d3.select("#muni-line-selector");
            var lineOption = lineSelector.selectAll("option")
                .data(data.documentElement.getElementsByTagName("route"))
                .enter().append("option");
            lineOption.attr({
                class: function(d) {
                    return "muni-line-option";
                },
                value: function(d) {
                    return d.getAttribute("title");
                },
                tag: function(d) {
                    return d.getAttribute("tag");
                }
            }).text(function(d) {
                return d.getAttribute("title");
            });
            $('#muni-line-selector').selectpicker();
        });
}

StationController.prototype.onNewStation = function(newLine) {
    var selectedLines = this.selectedLines;
    var map = this.map;
    if (!selectedLines.has(newLine.tag)) {
        // a new muni line has been selected for stations display
        selectedLines.set(newLine.tag, newLine);
        this.updateRow(map, newLine);
    }
}

StationController.prototype.updateRow = function(map, newLine) {
    var selecteLineTable = d3.select("table#displayed-stations")
        .select("tbody");

    var tr = selecteLineTable.selectAll("tr")
        .data(this.selectedLines.values()).enter().append("tr");

    var button = tr.append("td").append("button")
        .attr({
            type: 'button',
            class: "btn btn-default btn-lg pull-left",
            id: "color-btn-" + newLine.tag
        }).style({
            "background": newLine.color,
            "foreground": newLine.color
        });
    $("#color-btn-" + newLine.tag).colorpicker({
        color: newLine.color
    });

    tr.append("td").text(function(d) {
        return d.name;
    });

    this.retrieveStationPoints(map, tr, newLine);

    button = tr.append("td").append("button")
        .attr({
            type: 'button',
            class: "btn btn-default btn-lg pull-right",
        }).append("span").attr({
            class: "glyphicon glyphicon-trash"
        });
}

StationController.prototype.retrieveStationPoints = function(map, tr, newLine) {
    tr.append("td").append("select").attr({
        "class": "selectpicker"
    });
    // update the map with station points
    d3.xml("http://webservices.nextbus.com/service/publicXMLFeed?" +
        "command=routeConfig&a=sf-muni&r=" + newLine.tag, "application/xml",
        function(error, data) {
            var stops = data.documentElement.getElementsByTagName("stop");
            var stations = [];
            for (i = 0; i < stops.length; ++i) {
                var stop = stops[i];
                if (stop.getAttribute("title") != null) {
                    stations.push({
                        group: newLine.tag,
                        name: stop.getAttribute("title"),
                        pos: [stop.getAttribute("lat"), stop.getAttribute("lon")],
                        color: newLine.color
                    });
                }
            }
            map.addMarkers(newLine.tag, stations);
        });
}