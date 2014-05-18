/*************************************************
    Attributes:
 *************************************************/
MapController.prototype.selectedItems;
MapController.prototype.name;
MapController.prototype.displayName;
MapController.prototype.colorScale;
MapController.prototype.dataLoader;

/*************************************************
    Constructors:
 *************************************************/
function MapController(name, dataLoader) {
    MapController(name, dataLoader, null);
}

function MapController(name, dataLoader, scale) {
    this.selectedItems = d3.map();
    this.displayName = name;
    this.name = this.formatName(name);
    this.dataLoader = dataLoader;
    if (scale == null) {
        this.colorScale = d3.scale.category20();
    } else {
        colorScale = scale;
    }
}

/*************************************************
    Static functions:
 *************************************************/
var onSelection = function(e) {
    var self = e.data;
    var choice = $("option." + self.name + "-option[value='" + $(this).val() + "']");
    if (choice.length > 0) {
        var newItem = {
            tag: choice.attr('tag'),
            name: choice.attr('value'),
            color: self.colorScale(self.selectedItems.size()),
            data: self,
        };
        self.onNewItem(newItem);
    }
    // reset the list selector
    $("#" + self.name + "-selector").selectpicker('deselectAll');
}


var onClickRemove = function(e) {
    e.data.onRemoveItem(e);
}

/*************************************************
    Methods:
 *************************************************/
MapController.prototype.formatName = function(name) {
    return name.replace(/\s+/, '').toLowerCase();
}

MapController.prototype.init = function(rootNode) {
    this.initPage(rootNode);
    this.initSelector(this.dataLoader.getSelectorData());
    $("#" + this.name + "-selector").bind('change', this, onSelection);
}

MapController.prototype.initPage = function(rootNode) {
    $(rootNode).append('<br>\
        <form role = "form"> \
          <div class="form-group">\
            <select id="' + this.name + '-selector" class="form-control selectpicker"\
                data-live-search="true">\
              <option>Select ' + this.displayName + ' to display </option>\
            </select>\
          </div>\
          <div>\
            <table id="displayed-' + this.name + '"\
                class="table table-hover table-bordered">\
              <tbody>\
              </tbody>\
            </table>\
          </div>\
        </form>');
}

MapController.prototype.extractData = function(data) {
    return data;
}

MapController.prototype.extractTitle = function(data) {
    return data.getAttribute("title");
}


MapController.prototype.extractTag = function(data) {
    return data.getAttribute("tag");
}

MapController.prototype.initSelector = function(data) {
    var self = this;
    var lineSelector = d3.select("#" + self.name + "-selector");
    var lineOption = lineSelector.selectAll("option")
        .data(self.extractData(data))
        .enter().append("option");
    lineOption.attr({
        class: function(d) {
            return self.name + "-option";
        },
        value: function(d) {
            return self.extractTitle(d);
        },
        tag: function(d) {
            return self.extractTag(d);
        }
    }).text(function(d) {
        return self.extractTitle(d);
    });
    $('#' + self.name + '-selector').selectpicker();
}

MapController.prototype.onNewItem = function(elt) {
    if (!this.selectedItems.has(elt.tag)) {
        this.selectedItems.set(elt.tag, elt);
        this.updateItems();
    }
}

MapController.prototype.onRemoveItem = function(elt) {
    if (this.selectedItems.has(elt.tag)) {
        this.selectedItems.remove(elt.tag);
        this.dataLoader.removeDataFromMap(elt);
        this.updateItems();
    }
}

MapController.prototype.updateItems = function() {
    var self = this;
    var selecteLineTable = d3.select("table#displayed-" + this.name)
        .select("tbody");
    var tr = selecteLineTable.selectAll("tr")
        .data(this.selectedItems.values());
    tr.exit().remove();
    tr.select(".color-btn").style({
        background: function(d) {
            return d.color;
        },
        foreground: function(d) {
            return d.color;
        },
    });
    tr.select(".remove-btn").on('click', onClickRemove);
    var newTr = tr.enter().append("tr");
    var button = newTr.append("td").append("button")
        .attr({
            type: 'button',
            class: "color-btn btn btn-default btn-lg pull-left",
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
    var dataLoader = this.dataLoader;
    newTr.append("td").text(function(d) {
        dataLoader.addDataToMap(dataLoader, d);
        return d.name;
    });

    button = newTr.append("td").append("button")
        .on('click', onClickRemove)
        .attr({
            type: 'button',
            class: "remove-btn btn btn-default btn-lg pull-right",
        }).append("span").attr({
            class: "glyphicon glyphicon-trash"
        });
}