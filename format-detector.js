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
    this.rectanglas = [
        [0, ''],
        [1, 'квадрат'],
        [1.25, '1 и 1/4 квадрата'],
        [1.5, 'полтора квадрата'],
        [Math.sqrt(2), '√2'],
        [Math.sqrt(3), '√3'],
        [Math.sqrt(4), '√4'],
        [Math.sqrt(5), '√5'],
        [(1 + Math.sqrt(2)), 'серебрянный'],
        [(1 + Math.sqrt(5)) / 2, 'золотой'],
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

    var rectangle = this.rectanglas[0];
    var error = this.find_dimension_error(rectangle, d);

    for (var i = 1; i < this.rectanglas.length; i++) {
        var test_rectangle = this.rectanglas[i];
        var test_error = this.find_dimension_error(test_rectangle, d);
        if (Math.abs(test_error) < Math.abs(error)) {
            error = test_error;
            rectangle = test_rectangle;
        }
    }

    return [rectangle[1], this.error2string(error)];
}

FormatFinderOriginal.prototype.error2string = function(error_num) {
    var error = (Math.round(error_num * 1000.0))/10.0;
    return error + "%";
}

var FormatFinderIntelligent = function () {
    this.bases = [
        [Math.sqrt(2), '√2'],
        [Math.sqrt(3), '√3'],
        [Math.sqrt(4), '√4'],
        [Math.sqrt(5), '√5'],
    ];

    this.scales = [
        1, 2, 4
    ];
}

FormatFinderIntelligent.prototype = Object.create(FormatFinderOriginal.prototype);
FormatFinderIntelligent.prototype.constructor = FormatFinderIntelligent;

FormatFinderIntelligent.prototype.find = function(art_dimensions) {
    var d = art_dimensions.sort(function(a,b) {return b - a});
    var dp = d[0]/d[1];

    var squares = Math.floor(dp);
    if (squares == 2)
        squares = 1;
    var base = [squares, squares.toString()];
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

    return [name, this.error2string(scale_error[0])]
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

function show_dimension(name,w,h) {
    var algo = new FormatFinderIntelligent();
    var algo_name = document.getElementById('algorithm').value;
    if (algo_name === "original")
        algo = new FormatFinderOriginal();

    var r = algo.find([w,h]);

    document.getElementById('art-name').textContent = name;
    document.getElementById('art-dimension').textContent = r[0];
    document.getElementById('art-dimension-error').textContent = r[1];
}

function process_image_file() {
    var image_file = document.getElementById('art-file').files[0];
    var i = new Image();

    i.onload = function(){
        show_dimension(this.name, this.width, this.height);
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
