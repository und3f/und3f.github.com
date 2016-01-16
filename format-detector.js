/*  Copyright © 2016 Sergii Zasenko

    The JavaScript code in this file is free software: you can
    redistribute it and/or modify it under the terms of the GNU General
    Public License (GNU GPL) as published by the Free Software Foundation,
    either version 3 of the License, or (at your option) any later
    version.  The code is distributed WITHOUT ANY WARRANTY; without even
    the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR
    PURPOSE.  See the GNU GPL for more details.

    As additional permission under GNU GPL version 3 section 7, you may
    distribute non-source (e.g., minimized or compacted) forms of that
    code without the copy of the GNU GPL normally required by section 4,
    provided you include this license notice and a URL through which
    recipients can access the Corresponding Source. */

var FormatFinderOriginal = function() {
    this.bases = [
        [0, ''],
        [1, 'квадрат'],
        [1+1/3, '1 и 1/3 квадрата'],
        [1.25, '1 и 1/4 квадрата'],
        [1.5, 'полтора квадрата'],
        [Math.sqrt(2), '√2'],
        [Math.sqrt(3), '√3'],
        [Math.sqrt(4), '√4'],
        [Math.sqrt(5), '√5'],
        [(1 + Math.sqrt(2)), 'серебрянный прямоугольник'],
        [(1 + Math.sqrt(5)) / 2, 'золотой прямоугольник'],
        [11/10, '11x10'],
        [6/5, '6x5']
    ];
}

FormatFinderOriginal.prototype.find_dimension_error = function (dimension, d) {
    var error = 1 - dimension[0] / (d[0]/d[1]);
    return error;
}

FormatFinderOriginal.prototype.find = function (art_dimensions) {
    var d = art_dimensions.sort(function(a,b) {return b - a});

    var rectangle = this.bases[0];
    var error = this.find_dimension_error(rectangle, d);

    for (var i = 1; i < this.bases.length; i++) {
        var test_rectangle = this.bases[i];
        var test_error = this.find_dimension_error(test_rectangle, d);
        if (Math.abs(test_error) < Math.abs(error)) {
            error = test_error;
            rectangle = test_rectangle;
        }
    }

    return [rectangle[1], this.error2string(error), rectangle[0]];
}

FormatFinderOriginal.prototype.error2string = function(error_num) {
    var error = (Math.round(error_num * 1000.0))/10.0;
    return error + "%";
}

FormatFinderOriginal.prototype.getMarksInArea = function(area) {
    var marks = [];
    this.bases.forEach(function(base) {
        if (base[0] >= area[0] && base[0] <= area[1])
            marks.push(base);
    });
    return marks;
}

var FormatFinderIntelligent = function () {
    this.bases = [
        [Math.sqrt(5)/2, '√5/2'],
        [Math.sqrt(2),   '√2'],
        [Math.sqrt(3),   '√3'],
        [Math.sqrt(5),   '√5'],
    ];

    this.scales = [
        1, 2, 3, 4
    ];
}

FormatFinderIntelligent.prototype = Object.create(FormatFinderOriginal.prototype);
FormatFinderIntelligent.prototype.constructor = FormatFinderIntelligent;

FormatFinderIntelligent.prototype.find = function(art_dimensions) {
    var d = art_dimensions.sort(function(a,b) {return b - a});
    var dp = d[0]/d[1];

    var base = this.firstBase(dp);
    var scale_error = this.find_base_error(base, dp);

    for (var i = 0; i < this.bases.length; i++) {
        var test_base = this.bases[i];
        var test_se   = (this.find_base_error(test_base, dp));

        var diff = Math.abs(test_se[0]) - Math.abs(scale_error[0]);
        if ( (diff < 0)
                || (diff == 0 
                    && Math.abs(test_se[1][0]) < Math.abs(scale_error[1][0]))) {
            scale_error = test_se;
            base        = test_base;
        }
    }

    // At the end
    var name = base[1];
    name += this.scale2string(scale_error[1][0], scale_error[1][1]);

    return [name,
           this.error2string(scale_error[0]),
           this.calc_base_scale_number(base, scale_error)
    ];
}

FormatFinderIntelligent.prototype.firstBase = function(dp) {
    var squares = Math.round(dp);
    return [squares, squares.toString()]
}

FormatFinderIntelligent.prototype.scale2string = function(multiplier, scale) {
    var name = "";
    if (multiplier != 0) {
        if (multiplier > 0) { 
            name += "+";
        }

        if (scale == 1) {
            name += multiplier;
            return name
        }

        if (Math.abs(multiplier) > scale) {
            var whole = 
                multiplier/Math.abs(multiplier)
                 *Math.floor(Math.abs(multiplier/scale));
            name += whole;
            return name + this.scale2string(multiplier - whole*scale, scale);
        }

        name += multiplier + "/" + scale;
    }
    return name;
}

FormatFinderIntelligent.prototype.find_base_error = function (base, dp) {
    var scale = 0;
    var scale_error = this.find_base_scale_error(base, scale, dp);

    for (var i = 0; i < this.scales.length; i++) {
        var test_scale = this.scales[i];
        var test_se    = this.find_base_scale_error(base, test_scale, dp);
        if (Math.abs(test_se[0]) < Math.abs(scale_error[0])) {
            scale_error = test_se;
            scale       = test_scale;
        }
    }

    return scale_error;
}

FormatFinderIntelligent.prototype.calc_base_scale_number = function (base, scale) {
    var total = base[0];
    if (scale[1][0])
        total += scale[1][0]/scale[1][1];
    return total;
}

FormatFinderIntelligent.prototype.find_base_scale_error = function (base, scale, dp) {
    var total = base[0];
    var scale_multiplier = 0;
    if (scale) {
        scale_multiplier = Math.round((dp-total)*scale);
        total += scale_multiplier/scale;
    }

    if (total < 1)
        total = 1/total;

    return [1-total/dp,[scale_multiplier, scale]]
}

FormatFinderIntelligentSqrt4 = function() {
    FormatFinderIntelligent.call(this);
    this.bases.push([Math.sqrt(4), '√4']);
}

FormatFinderIntelligentSqrt4.prototype = Object.create(FormatFinderIntelligent.prototype);
FormatFinderIntelligent.prototype.constructor = FormatFinderIntelligent;

FormatFinderIntelligentSqrt4.prototype.firstBase = function(dp) {
    var squares = Math.round(dp);
    if (squares == 2)
        squares = 1;
    return [squares, squares.toString()]
}

FormatFinderIntelligentExtraAccuracy = function() {
    FormatFinderIntelligent.call(this);
    this.scales.push(5, 8, 9, 10);
}

FormatFinderIntelligentExtraAccuracy.prototype = Object.create(FormatFinderIntelligent.prototype);
FormatFinderIntelligentExtraAccuracy.prototype.constructor = FormatFinderIntelligentExtraAccuracy;

FormatFinderIntelligentExtraBasesAccuracy = function() {
    FormatFinderIntelligentExtraAccuracy.call(this);
    for (var i = 6; i <= 20; i++) {
        var sqrt = Math.sqrt(i);
        if (sqrt*sqrt == i)
            continue;
        this.bases.push([sqrt, '√' + i]);
    }
}

FormatFinderIntelligentExtraBasesAccuracy.prototype = Object.create(FormatFinderIntelligentExtraAccuracy.prototype);
FormatFinderIntelligentExtraBasesAccuracy.prototype.constructor = FormatFinderIntelligentExtraAccuracy;

FormatFinderReal = function() {
    this.scales = [2, 3, 4, 5];
}

FormatFinderReal.prototype = Object.create(FormatFinderIntelligent.prototype);
FormatFinderReal.prototype.constructor= FormatFinderIntelligent;

FormatFinderReal.prototype.find = function(art_dimensions) {
    var d = art_dimensions.sort(function(a,b) {return b - a});
    var dp = d[0]/d[1];

    var base = this.firstBase(dp);
    var scale_error = this.find_base_error(base, dp);

    var name = base[1];
    name += this.scale2string(scale_error[1][0], scale_error[1][1]);

    return [name,
           this.error2string(scale_error[0]),
           this.calc_base_scale_number(base, scale_error)
    ]
}

FormatFinderOriginal.prototype.getMarksInArea = function(area) {
    return [];
}

FormatFinderRealExtraAccuracy = function() {
    FormatFinderReal.call(this);
    this.scales.push(6, 9, 10);
}

FormatFinderRealExtraAccuracy.prototype = Object.create(FormatFinderReal.prototype);
FormatFinderRealExtraAccuracy.prototype.constructor = FormatFinderReal;

FormatFinderNumber = function() {
}

FormatFinderNumber.prototype.find = function(art_dimensions) {
    var d = art_dimensions.sort(function(a,b) {return b - a});
    var dp = d[0]/d[1];
    return [dp, '—', dp];
}

FormatFinderNumber.prototype.getMarksInArea = function(area) {
    return [];
}

function show_dimension(name,image) {
    var w = image.width;
    var h = image.height;
    var algo;
    var algo_name = document.getElementById('algorithm').value;
    switch (algo_name) {
        case "original":
            algo = new FormatFinderOriginal();
            break;
        case "intelligent-sqrt4":
            algo = new FormatFinderIntelligentSqrt4();
            break;
        case "intelligent-extraaccuracy":
            algo = new FormatFinderIntelligentExtraAccuracy();
            break;
        case "intelligent-extrabasesaccuracy":
            algo = new FormatFinderIntelligentExtraBasesAccuracy();
            break;
        case "real":
            algo = new FormatFinderReal();
            break;
        case "real-extraaccuracy":
            algo = new FormatFinderRealExtraAccuracy();
            break;
        case "number":
            algo = new FormatFinderNumber();
            break;
        case "intelligent":
        default:
            algo = new FormatFinderIntelligent();
    }
    var art_info = algo.find([w,h]);

    document.getElementById('art-name').textContent = name;
    document.getElementById('art-dimension').textContent = art_info[0];
    document.getElementById('art-dimension-error').textContent = art_info[1];

    var ruler = new RulerDrawer(document.getElementById('art-ruler'),image);

    ruler.drawMark(art_info[2], "F");
    var area = ruler.getRulerArea();
    //var marks = algo.getMarksInArea(area);
    // Default marks
    for (var i = Math.max(1, Math.ceil(area[0])); i <= Math.floor(area[1]); i++) {
        if (i == art_info[2])
            continue;
        ruler.drawMark(i, i.toString());
    }
}

function RulerDrawer(canvas, image, offset) {
    this.canvas  = canvas;
    this.ruler_margin = 15;

    this.geometry = {
        start: [0, 0],
        end:   [this.canvas.width, this.canvas.height]
    };
    this.context = this.canvas.getContext("2d");
    this.clearCanvas();

    this.offset = (offset == null) ? 0 : offset;

    this.drawImage(image);
}

RulerDrawer.prototype.drawImage = function (image) {
    var context = this.context;
    var size_on_canvas = this.isize = this.findSizeOnCanvas(image);

    this.horizontal = size_on_canvas[0] > size_on_canvas[1];

    var position_on_cavas = [];
    var p = this.horizontal ? 1 : 0;
    position_on_cavas[p] = this.ruler_margin;
    p = (p+1)%2;
    position_on_cavas[p] = this.geometry.start[p];

    this.iposition = position_on_cavas;

    this.dp = this.horizontal ? 
        image.width / image.height
        : image.height / image.width;

    this.fillImageEmptyArea();

    var offset_item = this.horizontal ? 0 : 1
    this.offset += (this.dp * position_on_cavas[offset_item]/size_on_canvas[offset_item]);

    context.drawImage(
            image,
            position_on_cavas[0],
            position_on_cavas[1],
            size_on_canvas[0],
            size_on_canvas[1]);
    this.drawRuler(position_on_cavas, size_on_canvas);
}

RulerDrawer.prototype.clearCanvas = function() {
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
}

RulerDrawer.prototype.fillImageEmptyArea = function() {
    var iposition = this.iposition;
    var isize = this.isize;

    var size = 3;
    var colors = ["#ffffff", "#cecece"];

    var y  = iposition[1];
    var my = iposition[1] + isize[1];
    if (!this.horizontal) {
        y = this.geometry.start[1];
        my = this.geometry.end[1];
    }

    var color = 0;
    for (; y < my; y += size, color++) {
        var x  = iposition[0];
        var mx = iposition[0] + isize[0];
        if (this.horizontal) {
            x = this.geometry.start[0];
            mx = this.geometry.end[0];
        }
        var xcolor = color;
        for (; x < mx; x += size) {
            this.context.fillStyle=colors[xcolor++ % colors.length];
            this.context.fillRect(
                    x,
                    y,
                    Math.min(size, mx-x),
                    Math.min(size, my-y)
                    ); 
        }
    }
}

RulerDrawer.prototype.drawRuler = function() {
    var isize = this.isize;
    var iposition = this.iposition;
    var context = this.context;
    var r = this.ruler_margin;

    var rw = context.lineWidth = 1;
    context.beginPath();
    var start = this.geometry.start;
    var end = this.geometry.end;
    if (this.horizontal) {
        var ri = [iposition[1]-rw, iposition[1]+isize[1]+rw];
        context.moveTo(start[0], ri[0]);
        context.lineTo(end[0], ri[0]);
        context.moveTo(start[0], ri[1]);
        context.lineTo(end[0], ri[1]);
    } else {
        var ri = [iposition[0]-rw, iposition[0]+isize[0]+rw];
        context.moveTo(ri[0], start[1]);
        context.lineTo(ri[0], end[1]);
        context.moveTo(ri[1], start[1]);
        context.lineTo(ri[1], end[1]);
    }

    context.strokeStyle = '#ff0000';
    context.stroke();
    context.closePath();

    this.drawMark(0, "0");
    var area = this.getRulerArea();
    this.drawMark(0, "1", true);
}

RulerDrawer.prototype.findSizeOnCanvas = function(image) {
    var rotate = image.width < image.height;
    var d = [image.width, image.height];
    var dc = [this.canvas.width-this.ruler_margin*2, this.canvas.height-this.ruler_margin*2];
    if (rotate) {
        d = d.reverse();
        dc = dc.reverse();
    }

    var newd = [];
    newd[0] = Math.min(d[0], dc[0]);
    newd[1] = Math.round(newd[0]/d[0] * d[1]);
    if (newd[1] > dc[1]) {
        newd[0] = Math.round(dc[1]/d[1] * d[0]);
        newd[1] = dc[1];
    };

    if (rotate)
        newd.reverse();
    return newd;
}

RulerDrawer.prototype.getRulerArea = function() {
    var i = this.horizontal ? 0 : 1;
    return [
        this.offset,
        this.offset + (this.geometry.end[i] - this.geometry.start[i]) / this.isize[(i+1)%2]];
}

RulerDrawer.prototype.drawMark = function(abs_position, label, opposite) {
    var position = abs_position/this.dp+this.offset
    var c = this.context;
    if (opposite == null)
        opposite = false;

    c.font = "10px Verdana";
    c.fillStyle = 'black';
    c.beginPath();
    if (this.horizontal) {
        var abs_pos = position * this.isize[0];
        var x = this.geometry.start[0] + abs_pos;
        c.moveTo(x, this.ruler_margin-1);
        c.lineTo(x, this.iposition[1] + this.isize[1] + 1);
        c.textAlign = 'left';

        c.textBaseline = opposite ? 'hanging' : 'bottom';
        var text_y = !opposite ? this.ruler_margin - 3 : this.iposition[1] + this.isize[1] + 3;
        c.fillText(label, x, text_y);
    } else {
        var abs_pos = position * this.isize[1];
        var y = this.geometry.start[1] + abs_pos;
        c.moveTo(this.ruler_margin-1, y);
        c.lineTo(this.iposition[0] + this.isize[0] + 1, y);
        c.textBaseline = 'top';

        c.textAlign = opposite ? 'left' : 'right';
        var text_x = !opposite ? this.ruler_margin - 3 : this.iposition[0] + this.isize[0] + 3;
        c.fillText(label, text_x, y);
    }
    c.strokeStyle = '#ff0000';
    c.stroke();
    c.closePath();
}

function process_image_file() {
    var image_file = document.getElementById('art-file').files[0];
    var i = new Image();

    i.onload = function(){
        show_dimension(this.name, this);
        URL.revokeObjectURL(this.src);
    }

    var matched = /^(.+)\.\w+$/.exec(image_file.name);
    if (matched) {
        i.name = matched[1]
    } else {
        i.name = image_file.name
    }

    i.src=URL.createObjectURL(image_file);
}
