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
    var error = dimension[0] / (d[0]/d[1]) - 1;
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

    return [this.nameToString(base, scale_error),
           this.error2string(scale_error[0]),
           this.calc_base_scale_number(base, scale_error),
           [base, scale_error]
    ];
}

FormatFinderIntelligent.prototype.nameToString = function(base, scale_error) {
    var name = base[1];
    if (!isNaN(name) && scale_error[1][0] < 0) {
        return ( (+name * scale_error[1][1] + scale_error[1][0]) + "/" + scale_error[1][1] );
    }
    name += this.scale2string(scale_error[1][0], scale_error[1][1]);
    return name;
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

    return [total/dp - 1, [scale_multiplier, scale]]
}

FormatFinderIntelligent.prototype.getMarksInArea = function(area, art_info) {
    var marks = FormatFinderOriginal.prototype.getMarksInArea.call(this, area);
    if (art_info == null || art_info.length < 4)
        return marks;

    var scale = art_info[3][1][1];
    if (scale[0] == 0)
        return marks;

    var whole = Math.floor(area[0]);
    var i     = Math.floor((area[0]-whole) * scale[1]);
    var total = whole + i / scale[1];
    do {
        if (total > area[0]) {
            var name = "";
            if (whole > 0) {
                name += whole + " ";
            }
            if (i > 0) {
                name += i + "/" + scale[1];
            }
            marks.push([total, name]);
        }
        i++;
        if (i >= scale[1]) {
            i -= scale[1];
            whole ++;
        }
        total = whole + i / scale[1];
    } while (total <= area[1])

    return marks;
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
    this.bases  = [];
    this.scales = [2, 3, 4, 5];
}

FormatFinderReal.prototype = Object.create(FormatFinderIntelligent.prototype);
FormatFinderReal.prototype.constructor= FormatFinderIntelligent;

FormatFinderReal.prototype.find = function(art_dimensions) {
    var d = art_dimensions.sort(function(a,b) {return b - a});
    var dp = d[0]/d[1];

    var base = this.firstBase(dp);
    var scale_error = this.find_base_error(base, dp);

    return [this.nameToString(base, scale_error),
           this.error2string(scale_error[0]),
           this.calc_base_scale_number(base, scale_error),
           [base, scale_error]
    ]
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

function formatFinderFactory(name) {
    switch (name) {
        case "original":
            return new FormatFinderOriginal();
        case "intelligent-sqrt4":
            return new FormatFinderIntelligentSqrt4();
        case "intelligent-extraaccuracy":
            return new FormatFinderIntelligentExtraAccuracy();
        case "intelligent-extrabasesaccuracy":
            return new FormatFinderIntelligentExtraBasesAccuracy();
        case "real":
            return new FormatFinderReal();
        case "real-extraaccuracy":
            return new FormatFinderRealExtraAccuracy();
        case "number":
            return new FormatFinderNumber();
        case "intelligent":
        default:
            return new FormatFinderIntelligent();
    };
}

function GridFactory(name) {
    switch (name) {
        case "halfs":
            return SplitHalfs;
        case "trills":
            return SplitTrills;
        case "golden":
            return SplitGolden;
        case "silver":
            return SplitSilver;
    }
    return;
}

function SplitHalfs(length) {
    return length / 2;
}

function SplitTrills(length) {
    return length / 3;
}

function SplitGolden(length) {
    return length - length * (Math.sqrt(5) - 1) / 2;
}

function SplitSilver(length) {
    return length * (Math.sqrt(2) - 1);
}

function RulerDrawer(canvas, image) {
    this.canvas  = canvas;
    this.ruler_margin = 1;

    this.geometry = {
        start: [0, 0],
        end:   [this.canvas.width, this.canvas.height]
    };
    this.context = this.canvas.getContext("2d");
    this.marks  = [];

    this.image  = image;

    this.horizontal = image.width > image.height;
    this.dp = this.horizontal ? 
        image.width / image.height
        : image.height / image.width;

}

RulerDrawer.prototype.calcImagePosition = function(ruler_format) {
    var image = this.image;
    var size_on_canvas = this.isize = this.findSizeOnCanvas(ruler_format);

    var axis = this.horizontal ? 0 : 1;
    var opposite_axis = (axis + 1) % 2;

    var position_on_cavas = [this.ruler_margin, this.ruler_margin];

    this.iposition = position_on_cavas;
}

RulerDrawer.prototype.drawImage = function(ruler_format) {
    if (ruler_format == null || ruler_format < this.dp) 
        ruler_format = this.dp;

    this.calcImagePosition(ruler_format);

    var context = this.context;
    this.clearCanvas();
    context.drawImage(
            this.image,
            this.iposition[0],
            this.iposition[1],
            this.isize[0],
            this.isize[1]);
}

RulerDrawer.prototype.clearCanvas = function() {
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
}

RulerDrawer.prototype.fillImageEmptyArea = function() {
    var iposition = this.iposition;
    var isize = this.isize;

    var size = 3;
    var colors = ["#ffffff", "#cecece"];

    var y  = this.geometry.start[1];
    var my = this.geometry.end[1];
    if (!this.horizontal) {
        y = this.geometry.start[1];
        my = this.geometry.end[1];
    }

    var color = 0;
    for (; y < my; y += size, color++) {
        var x  = this.geometry.start[0];
        var mx = this.geometry.end[0];
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

RulerDrawer.prototype.drawRuler = function(format) {
    if (format == null)
        format = this.dp;

    var isize = this.isize;
    var iposition = this.iposition;
    var context = this.context;
    var r = this.ruler_margin;

    // this.fillImageEmptyArea();

    var rw = context.lineWidth = 1;
    context.beginPath();
    var start = this.geometry.start;
    var end = this.geometry.end;

    var axis = this.horizontal ? 0 : 1;
    var opposite_axis = (axis + 1) % 2;
    var ri        = [
        Math.round(iposition[opposite_axis]-rw),
        Math.round(iposition[opposite_axis]+isize[opposite_axis]+rw)
    ];
    var izero     = Math.round(iposition[axis]);
    var iend      = Math.round(end[axis]);
    var fposition = Math.round(iposition[axis] + format * isize[opposite_axis]);

    var dots = [
        [fposition,  ri[1]],
        [izero, ri[1]],
        [izero, ri[0]],
        [fposition, ri[0]]
    ];

    if (!this.horizontal)
        dots.forEach(function(dot, i, dots) {
            dots[i] = dot.reverse();
        });

    var dot1 = dots.shift();
    context.moveTo.apply(context, dot1);
    dots.forEach(function(dot) {
        context.lineTo.apply(context, dot);
    });
    context.lineTo.apply(context, dot1);

    context.strokeStyle = '#ff0000';
    context.stroke();
    context.closePath();

    /*
    this.drawMark(0, "0", false);
    this.drawMark(format, "F", false);
    this.drawMark(0, "1", true);
    */
}

RulerDrawer.prototype.findSizeOnCanvas = function(ruler_format) {
    var axis  = this.horizontal ? 0 : 1;
    var opposite_axis = (axis+1) % 2;

    var image_space = [
        this.canvas.width - this.ruler_margin  * 2,
        this.canvas.height - this.ruler_margin * 2
    ];

    var possible_image_size  = [image_space[axis] / ruler_format, image_space[opposite_axis]];

    var image_size = [];
    image_size[opposite_axis] = Math.floor(Math.min.apply(Math, possible_image_size));
    image_size[axis]          = image_size[opposite_axis] * this.dp;

    return image_size;
}

RulerDrawer.prototype.getRulerArea = function() {
    var i = this.horizontal ? 0 : 1;
    return [
        0,
        this.dp]
}

RulerDrawer.prototype.drawMark = function(rel_position, label, opposite) {
    var c = this.context;

    var axis = this.horizontal ? 0 : 1;
    var opposite_axis = (axis+1) % 2;

    var position = this.iposition[axis] + rel_position * this.isize[opposite_axis];
    var start_pos = [position, this.iposition[opposite_axis]-1];
    var end_pos = [position, this.iposition[opposite_axis] + this.isize[opposite_axis]+1];

    if (this.horizontal) {
        c.textAlign = 'left';
        c.textBaseline = opposite ? 'hanging' : 'bottom';
    } else {
        c.textBaseline = 'top';
        c.textAlign = opposite ? 'left' : 'right';
    }

    var text_pos = [];
    text_pos[0] = position;
    text_pos[1] = !opposite ?
        this.iposition[opposite_axis] - 3 
        : this.iposition[opposite_axis] + this.isize[opposite_axis] + 3;

    if (!this.horizontal) {
        start_pos = start_pos.reverse();
        end_pos   = end_pos.reverse();
        text_pos  = text_pos.reverse();
    }

    /*
    c.beginPath();
    c.moveTo.apply(c, start_pos);
    c.lineTo.apply(c, end_pos);
    c.strokeStyle = '#ff0000';
    c.stroke();
    c.closePath();
    */

    text_pos.unshift(label);

    c.font = "10px Verdana";
    c.fillStyle = 'black';
    c.fillText.apply(c, text_pos);

    return true;
}

RulerDrawer.prototype.drawGrid = function(split_func, direction) {
    if (direction == null)
        direction = [false, false];

    var axis = this.horizontal ? 0 : 1;
    var opposite_axis = (axis+1) % 2;
    var c = this.context;

    c.beginPath();
    for (var i = 0, lengths = this.isize.slice(); i < 4; i++) {
        lengths.forEach(function(length, i, lengths) {
            lengths[i] = split_func(length);
        });
        [0, 1].forEach(function(axis) {
            this._drawGridLine(axis, lengths[axis], direction[axis]);
        }, this)
    }

    c.strokeStyle = 'gold';
    c.stroke();
    c.closePath();
}

RulerDrawer.prototype._drawGridLine = function(axis, length, reverse) {
    var opposite_axis = (axis + 1) % 2;
    var c = this.context;
    var lstart = [], lend = [];

    var axis_pos = ! reverse ? 
        this.iposition[axis] + length
        : this.iposition[axis] + this.isize[axis] - length;
    axis_post = Math.round(axis_pos);
    lstart[axis] = lend[axis] = axis_pos;
    lstart[opposite_axis]     = this.iposition[opposite_axis];
    lend[opposite_axis]       = this.iposition[opposite_axis] + this.isize[opposite_axis];

    c.moveTo.apply(c, lstart);
    c.lineTo.apply(c, lend);
}

function ImageAnalyzer(args) {
    this.name_elem = args["name"];
    this.format_elem = args["format"];
    this.error_elem = args["error"];
    this.canvas = args["canvas"];
    this.grid_direction = 0;

    this.grid_directions = [
        [false, false],
        [true,  false],
        [true,  true],
        [false, true]
    ];


    this.registerTriggerImage(args["image"]);
    this.registerTriggerFormatAlgo(args["algo"]);
    this.registerTriggerGrid(args["grid"]);
    this.registerTriggerGridRotate(args["grid-rotate"]);
}

ImageAnalyzer.prototype.registerTriggerImage = function(file_elem) {
    var that = this;
    file_elem.onchange = function() {
        var image_file = file_elem.files[0];
        if (image_file == null)
            return;

        var i = new Image();

        i.onload = function(){
            that.changeImage(this, this.name);
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

    file_elem.onchange();
}

ImageAnalyzer.prototype.changeImage = function(image, name) {
    this.clearImage();

    this.image = image;
    if (this.name_elem)
        this.name_elem.textContent = name;
    this.analyzeImage();
}

ImageAnalyzer.prototype.clearImage = function() {
    delete this.ruler;
    delete this.image;
}

ImageAnalyzer.prototype.registerTriggerFormatAlgo = function(algo_elem) {
    var that = this;

    algo_elem.onchange = function() {
        that.changeFormatAnalyzer(algo_elem.value);
    };

    algo_elem.onchange();
}

ImageAnalyzer.prototype.changeFormatAnalyzer = function(algo_name) {
    this.algo = formatFinderFactory(algo_name);
    this.analyzeImage();
}

ImageAnalyzer.prototype.registerTriggerGrid = function(grid_elem) {
    var that = this;
    grid_elem.onchange = function() {
        that.changeGrid(grid_elem.value);
    }

    grid_elem.onchange();
}

ImageAnalyzer.prototype.changeGrid = function() {
    this.grid = GridFactory(document.getElementById('grid').value);
    this.redrawImage();
}

ImageAnalyzer.prototype.registerTriggerGridRotate = function(grid_rotate_elem) {
    var that = this;
    grid_rotate_elem.onclick = function() {
        that.rotateGrid();
    }
}

ImageAnalyzer.prototype.rotateGrid = function() {
    this.grid_direction = (this.grid_direction + 1) % this.grid_directions.length;
    this.redrawImage();
}

ImageAnalyzer.prototype.analyzeImage = function() {
    if (this.image == null)
        return

    var w = this.image.width;
    var h = this.image.height;
    this.art_info = this.algo.find([w,h]);

    this.format_elem.textContent = this.art_info[0];
    if (this.error_elem)
        this.error_elem.textContent  = this.art_info[1];
    this.redrawImage();
}

ImageAnalyzer.prototype.redrawImage = function() {
    if (this.image == null)
        return

    if (this.ruler == null) {
        this.ruler = new RulerDrawer(this.canvas, this.image);
    }

    this.ruler.drawImage(this.art_info[2]);
    this.ruler.drawRuler(this.art_info[2]);
    this.ruler.drawGrid(this.grid, this.grid_directions[this.grid_direction]);
}
