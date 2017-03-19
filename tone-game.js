/*  Copyright © 2017 Sergii Zasenko

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

"use strict";
function ToneGame(args) {
    this.canvas = args["canvas"];
    this.ctx = this.canvas.getContext('2d');

    this.calcGeometry();

    this.answerResultCallback = args["answerResult"];

    this.style = {
        "correct":  "#25934c",
        "wrong":    "#b1592f"
    };

    var that = this;
    this.canvas.addEventListener('click', function(event) {
        that.processCanvasClick(event);
    });

    this.cellsNumberInput = args["cellsNumberInput"];
    this.cellsNumberInput.onchange = function() {
        that.restart()
    }

    this.complexityOption = args["complexityOption"];
    this.complexityOption.onchange = function() {
        that.newGame();
    };

    this.restart();
}

ToneGame.prototype.restart = function() {
    this.calcGeometry(this.cellsNumberInput.value);
    this.newGame();
}

ToneGame.prototype.calcGeometry = function(cellsNumber) {
    this.cellsNumber    = cellsNumber;
    this.width          = this.canvas.width;
    this.height         = this.canvas.height;
    if (cellsNumber !== undefined) {
        this.cellWidth      = this.width/this.cellsNumber;
        this.visualCellWidth = this.canvas.offsetWidth/this.cellsNumber;
    }
}

ToneGame.prototype.newGame = function() {
    this.ctx.clearRect(0, 0, this.width, this.height);
    this.colorError = this.complexityOption.value;

    var that = this;
    setTimeout(function() { that.drawStrip() }, 100);
}

ToneGame.prototype.processCanvasClick = function(event) {
    if (this.redraw) {
        delete this.redraw;
        return this.newGame();
    }

    if (this.wrongCell === null)
        return;

    var x = event.pageX - this.canvas.offsetLeft;

    var cellIndex = Math.floor(x / this.visualCellWidth);

    this.highlightCell(cellIndex, this.style.wrong);
    this.highlightCell(this.wrongCell, this.style.correct);

    this.answerResultCallback(cellIndex == this.wrongCell);

    this.redraw = true;
}

ToneGame.prototype.highlightCell = function(i, style) {
    this.ctx.lineWidth = 1;
    this.ctx.strokeStyle = style;
    this.ctx.strokeRect(this.cellWidth * i, 0, this.cellWidth, this.height);
}

ToneGame.prototype.drawStrip = function() {
    var ctx = this.ctx;
    var cellsNumber = this.cellsNumber;


    if (this.colorError > 0 && this.cellsNumber >= 3) {
        this.wrongCell  = Math.floor(Math.random() * this.cellsNumber);
        this.canvas.style.cursor = "pointer";
    }
    else {
        this.wrongCell = null;
        this.canvas.style.cursor = "auto";
    }

    var colorBegin      = new RGB("#000000");
    var colorEnd        = new RGB("#ffffff");
    var colorIncrement  = colorEnd.diff(colorBegin).divide(cellsNumber-1);

    this.wrongCellColorDiff = colorIncrement.divide(this.colorError);

    for (var i = 0; i < cellsNumber; i++) {
        var color   = colorBegin.add(colorIncrement, i);
        if (i == this.wrongCell) {
            if (i == 0)
                color = color.add(this.wrongCellColorDiff, 1);
            else if (i == cellsNumber-1)
                color = color.add(this.wrongCellColorDiff, 1, 1);
            else 
                color = color.add(this.wrongCellColorDiff, 1, Math.round(Math.random()));
        }

        var x = Math.floor(this.cellWidth * i);
        
        ctx.fillStyle = color.toString();
        ctx.fillRect(x, 0, Math.ceil(this.cellWidth), this.height);
    }
}

function RGB (colorObject) {
    if (typeof colorObject === "string") {
        var colorInt = parseInt(colorObject.substring(1, 7), 16);
        this.rgb = [colorInt >> 16, colorInt >> 8 & 0xff, colorInt & 0xff];
    } else if (colorObject instanceof Array) {
        this.rgb = colorObject;
    }
}

RGB.prototype.getRGB = function() {
    return this.rgb;
}

RGB.prototype.diff  = function(color) {
    var resultColor = new Array(3);
    for (var i = 0; i < 3; i++) {
        resultColor[i] = this.rgb[i] - color.rgb[i];
    }
    return new RGB(resultColor);
}

RGB.prototype.add = function(color, times, substract) {
    if (times === undefined)
        times = 1;
    else if (times === 0)
        return this;

    var sign = substract ? -1 : 1;

    var resultColor = new Array(3);
    for (var i = 0; i < 3; i++) {
        resultColor[i] = this.rgb[i] + sign * color.rgb[i] * times;
    }
    return new RGB(resultColor)
}

RGB.prototype.divide = function(times) {
    var resultColor = new Array(3);
    for (var i = 0; i < 3; i++) {
        resultColor[i] = this.rgb[i] / times;
    }
    return new RGB(resultColor)
}

RGB.prototype.toString = function() {
    var string = "rgb(" + this.rgb.map(function(color) {
        return color.toFixed()
    }).join(", ") + ")";
    return string;
}

