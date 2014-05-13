/*************************************************
    Attributes:
 *************************************************/
StationController.prototype.map;
StationController.prototype.selectedLines;
var colorScale = d3.scale.category20();

/*************************************************
    Constructors:
 *************************************************/
function StationController(map) {
    this.map = map;
    this.selectedLines = [];
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
            color: colorScale(e.data.selectedLines.length),
            data: e.data,
        };
        e.data.onNewStation(newLine);
    }
    // reset the muni-line-list selector
    $("#muni-line-selector").selectpicker('deselectAll');
}


var onClickRemove = function(e) {
    e.data.onRemoveStation(e);
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
            if (error != null) {
                console.log(error);
            }

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

StationController.prototype.onNewStation = function(elt) {
    if (this.selectedLines.indexOf(elt) == -1) {
        this.selectedLines.push(elt);
        this.updateStations();
    }
}

StationController.prototype.onRemoveStation = function(elt) {
    var index = this.selectedLines.indexOf(elt);
    if (index != -1) {
        this.selectedLines.splice(index, 1);
        this.map.removeMarkers(elt.tag);
        $('#tr-' + elt.tag).remove();
    }
}

StationController.prototype.updateStations = function() {
    var selecteLineTable = d3.select("table#displayed-stations")
        .select("tbody");
    var tr = selecteLineTable.selectAll("tr")
        .data(this.selectedLines);

    var newTr = tr.enter().append("tr").attr({
        id: function(d) {
            return "tr-" + d.tag;
        }
    });

    var button = newTr.append("td").append("button")
        .attr({
            type: 'button',
            class: "btn btn-default btn-lg pull-left",
            data: function(d) {
                return d;
            },
        }).style({
            background: function(d) {
                return d.color;
            },
            foreground: function(d) {
                return d.color;
            },
        });

    // $("#color-btn-" + elt.tag).colorpicker({
    //     color: elt.color
    // });
    var retrieveStationPoints = this.retrieveStationPoints;
    var map = this.map;
    newTr.append("td").text(function(d) {
        retrieveStationPoints(map, d);
        return d.name;
    });

    button = newTr.append("td").append("button")
        .on('click', onClickRemove)
        .attr({
            type: 'button',
            class: "btn btn-default btn-lg pull-right",
            tag: function(d) {
                return d.tag;
            },
        }).append("span").attr({
            class: "glyphicon glyphicon-trash"
        });
}

StationController.prototype.retrieveStationPoints = function(map, elt) {
    // tr.append("td").append("select").attr({
    //     "class": "selectpicker"
    // });
    // update the map with station points
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
            map.addMarkers(elt.tag, stations);
        });
}