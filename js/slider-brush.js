/*************************************************
    Attributes:
 *************************************************/
SliderBrush.prototype.onNewValue;
SliderBrush.prototype.brush;
SliderBrush.prototype.x;
SliderBrush.prototype.handle;
SliderBrush.prototype.oldValue = 0;
/*************************************************
    Constructors:
 *************************************************/
function SliderBrush(rootNode, defaultValue, domainValues, dimensions, margin, onNewValue) {
    this.onNewValue = onNewValue;
    this.init(rootNode, defaultValue, domainValues, dimensions, margin);
}

/*************************************************
    Methods:
 *************************************************/
SliderBrush.prototype.init = function(rootNode, defaultValue, domainValues, dimensions, margin) {
    var self = this;
    var width = dimensions[0];
    var height = dimensions[1];
    self.x = d3.scale.linear()
        .domain(domainValues)
        .range([0, width])
        .clamp(true);

    self.brush = d3.svg.brush()
        .x(self.x)
        .extent([0, 0])
        .on("brush", self.brushed(self));

    var svg = d3.select(rootNode).append("svg").attr({
        "width": width + margin.left + margin.right,
        "height": height + margin.top + margin.bottom,
        "class": "sliderBrush",
    }).append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    svg.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + height / 2 + ")")
        .call(d3.svg.axis()
            .scale(self.x)
            .orient("bottom")
            // .tickFormat(function(d) {
            //     return d + "°";
            // })
            .tickSize(0)
            .tickPadding(12))
        .select(".domain")
        .select(function() {
            return this.parentNode.appendChild(this.cloneNode(true));
        })
        .attr("class", "halo");

    var slider = svg.append("g")
        .attr("class", "slider")
        .call(self.brush);

    slider.selectAll(".extent,.resize")
        .remove();

    slider.select(".background")
        .attr("height", height);

    self.handle = slider.append("circle")
        .attr("class", "handle")
        .attr("transform", "translate(0," + height / 2 + ")")
        .attr("r", 9);

    slider
        .call(self.brush.event)
        .transition()
        .duration(750)
        .call(self.brush.extent([defaultValue, defaultValue]))
        .call(self.brush.event);
}

SliderBrush.prototype.brushed = function(self) {
    return function() {
        var value = self.brush.extent()[0];
        value = Math.round(value);
        if (d3.event.sourceEvent) {
            value = self.x.invert(d3.mouse(this)[0]);
            value = Math.round(value);
            self.brush.extent([value, value]);
        }
        if (self.oldValue != value) {
            self.handle.attr("cx", self.x(value));
            self.onNewValue(value);
            self.oldValue = value;
        }
    }
}