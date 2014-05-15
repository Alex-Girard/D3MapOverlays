/*************************************************
    Attributes:
 *************************************************/
MapController.prototype.selectedItems;
MapController.prototype.name;
MapController.prototype.colorScale;
MapController.prototype.dataLoader;

/*************************************************
    Constructors:
 *************************************************/
function MapController(rootNode, name, dataLoader) {
    this.selectedItems = [];
    this.name = name;
    this.dataLoader = dataLoader;
    this.colorScale = d3.scale.category20();
    this.initPage(rootNode);
    this.initSelector(dataLoader.getSelectorData());
    $("#" + name + "-selector").bind('change', this, onSelection);
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
            color: self.colorScale(self.selectedItems.length),
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

MapController.prototype.initPage = function(rootNode) {
    $(rootNode).append('<br>\
        <form role = "form"> \
          <div class="form-group">\
            <select id="' + this.name + '-selector" class="form-control selectpicker"\
                data-live-search="true">\
              <option>Select ' + this.name + ' to display </option>\
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

MapController.prototype.initSelector = function(data) {
    var self = this;
    var lineSelector = d3.select("#" + self.name + "-selector");
    var lineOption = lineSelector.selectAll("option")
        .data(data)
        .enter().append("option");
    lineOption.attr({
        class: function(d) {
            return self.name + "-option";
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
    $('#' + self.name + '-selector').selectpicker();
}

MapController.prototype.onNewItem = function(elt) {
    if (this.selectedItems.indexOf(elt) == -1) {
        this.selectedItems.push(elt);
        this.updateItems();
    }
}

MapController.prototype.onRemoveItem = function(elt) {
    var index = this.selectedItems.indexOf(elt);
    if (index != -1) {
        this.selectedItems.splice(index, 1);
        this.dataLoader.removeDataFromMap(elt);
        this.updateItems();
    }
}

MapController.prototype.updateItems = function() {
    var self = this;
    var selecteLineTable = d3.select("table#displayed-" + this.name)
        .select("tbody");
    var tr = selecteLineTable.selectAll("tr")
        .data(this.selectedItems);
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