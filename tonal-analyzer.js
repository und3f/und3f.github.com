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

function TonalAnalyzer (image, canvas) {
    this.canvas = canvas;
    this.image  = image;

    this.init()
}

TonalAnalyzer.prototype.init = function() {
    this.ruler_margin = 1;

    this.horizontal = this.image.width > this.image.heigth;
    this.axis = this.horizontal ? 0 : 1;
    this.opposite_axis = (this.axis + 1) % 2;

    this.grays = [
        [0, 0, 0],
        [136, 136, 136],
        [255, 255, 255]
    ];

    this.dp = this.horizontal ? 
        this.image.width / this.image.height
        : this.image.height / this.image.width;

    var min_size  = 100;
    this.min_size = new Array(2);
    this.min_size[this.opposite_axis] = min_size / this.dp;
    this.min_size[this.axis] = Math.round(min_size);
    console.log(this.min_size, this.dp);

    this.resize();

    this.context   = this.canvas.getContext("2d");
}

TonalAnalyzer.prototype.resize = function() {
    this.adjustCanvas();
    this.isize     = this.findSizeOnCanvas();
    this.iposition = this.calcImagePosition();
}

TonalAnalyzer.prototype.adjustCanvas = function() {
    canvas.width = 1;
    canvas.height = 1;
    canvas.style.width = null;
    canvas.style.height = null;

    var image_size = [this.image.width, this.image.height];
    var parent_el  = this.canvas.parentNode;
    var free_size  = this.findSizeOnFrame([
            parent_el.offsetWidth - this.ruler_margin*2,
            parent_el.offsetHeight - this.ruler_margin*2
            ]);
    var c_size = image_size[0] < free_size[0] ? image_size : free_size;

    if (c_size[0] < this.min_size[0] || c_size[1] < this.min_size[1]) {
        c_size = this.min_size;
    }

    this.canvas.width = image_size[0];
    this.canvas.height = image_size[1];
    this.canvas.style.width = c_size[0];
    this.canvas.style.height = c_size[1];
}

TonalAnalyzer.prototype.findSizeOnFrame = function(frame) {
    var axis  = this.axis
    var opposite_axis = this.opposite_axis;

    var possible_image_size  = [frame[axis] / this.dp, frame[opposite_axis]];

    var image_size = [];
    image_size[opposite_axis] = Math.floor(Math.min.apply(Math, possible_image_size));
    image_size[axis]          = Math.floor(image_size[opposite_axis] * this.dp);

    return image_size;
}

TonalAnalyzer.prototype.findSizeOnCanvas = function() {
    return this.findSizeOnFrame([
        this.canvas.width,
        this.canvas.height
    ]);
}

TonalAnalyzer.prototype.calcImagePosition = function() {
    var image = this.image;

    var position_on_cavas = [0, 0];

    return position_on_cavas;
}

TonalAnalyzer.prototype.analyze = function(gray_borders, display) {
    if (display == null)
        display: "analyzed";

    this.draw();

    var imgd = this.context.getImageData(
            this.iposition[0], this.iposition[1],
            this.isize[0], this.isize[1]);

    var data = imgd.data;

    var color_brigthness = [0.21, 0.72, 0.007];

    var total_tone = [0, 0, 0];

    for (var i = 0, n = data.length-4; i < n; i += 4) {
        var brigthness = 0;
        for (var j = 0; j < 3; j++) {
            brigthness += data[j+i] * color_brigthness[j];
        }

        var gray = 1;
        if (brigthness < gray_borders[0])
            gray = 0;
        else if (brigthness > gray_borders[1])
            gray = 2;
        total_tone[gray]++;

        for (var j = 0; j < 3; j++) {
            switch (display) {
                case "analyzed": 
                    data[i+j] = this.grays[gray][j];
                    break;
                case "grayscale":
                    data[i+j] = brigthness;
                    break;
            }
        }
    }

    this.clearCanvas();
    this.context.putImageData(imgd, this.iposition[0], this.iposition[1]);

    var total_pixels = total_tone.reduce(function(a,b){return a+b});
    var total_tone_percent = new Array(3);
    total_tone.forEach(function(tone, i, total_tone) {
        total_tone_percent[i] = tone / total_pixels;
    })

    return total_tone_percent;
}

TonalAnalyzer.prototype.draw = function() {
    this.clearCanvas();
    this.context.drawImage(
            this.image,
            this.iposition[0],
            this.iposition[1],
            this.isize[0],
            this.isize[1]);
}

TonalAnalyzer.prototype.clearCanvas = function() {
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
}
