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
function color2RGB(color) {
  var rgb = [];
  for (var i = 0; i < 3; i++) {
    rgb[i] = parseInt(color.substring(i*2, (i+1)*2), 16);
  }
  return rgb;
}

function RGB2Color(rgb) {
    var color = "";
    for (var i = 0; i < 3; i++) {
        color += (rgb[i] < 0x10 ? "0" : "") + Math.round(rgb[i]).toString(16);
    }
    return color;
}

function RGBLuma(rgb) {
    return [0.3 * rgb[0] + 0.59 * rgb[1] + 0.11 * rgb[2], 0, 0];
}

/**
 * Converts an HSV color value to RGB. Conversion formula
 * adapted from http://en.wikipedia.org/wiki/HSV_color_space.
 * Assumes h, s, and v are contained in the set [0, 1] and
 * returns r, g, and b in the set [0, 255].
 *
 * @param   Number  h       The hue
 * @param   Number  s       The saturation
 * @param   Number  v       The value
 * @return  Array           The RGB representation
 */
function hsvToRgb(h, s, v) {
  var r, g, b;

  var i = Math.floor(h * 6);
  var f = h * 6 - i;
  var p = v * (1 - s);
  var q = v * (1 - f * s);
  var t = v * (1 - (1 - f) * s);

  switch (i % 6) {
    case 0: r = v, g = t, b = p; break;
    case 1: r = q, g = v, b = p; break;
    case 2: r = p, g = v, b = t; break;
    case 3: r = p, g = q, b = v; break;
    case 4: r = t, g = p, b = v; break;
    case 5: r = v, g = p, b = q; break;
  }

  return [ r * 255, g * 255, b * 255 ];
}

function saturace(color) {
    var rgb = color2RGB(color);
    var maxColor = Math.max.apply(Math, rgb);
    var multiplier = 255/maxColor;
    var rgbSaturated = [];
    for (var i in rgb) {
        rgbSaturated[i] = Math.round(rgb[i] * multiplier);
    }
    return RGB2Color(rgbSaturated);
}

var colors_classic = [
  "c12e24", "b62826", "a52c35",
  "952939", "782841", "592d5a",
  "3c3271", "29418a", "12419c",
  "105395", "065988", "0e6785",
  "127381", "077d75", "127f59",
  "228741", "6c9f32", "a5a519",
  "cea50d", "cf920b", "d16e10",
  "ce5c1e", "cf4721", "cb3a1f",
];

var colors_saturated = [];
for (var i in colors_classic) {
  colors_saturated.push(saturace(colors_classic[i]));
}

function generateWheel(colorsNumber, saturation, value) {
    var colors = [];
    var hueStep = 1/colorsNumber;

    var hueRotate = 1/colorsNumber/2;
    for (var i = 0; i < colorsNumber; i++) {
        var hue = (1 - hueStep * i + hueRotate) % 1;
        colors[i] = RGB2Color(hsvToRgb(hue, saturation, value));
    }
    return colors;
}

function initWheel(wheelEl, generateWheel) {
    var width = wheelEl.width.baseVal.value;
    var height = wheelEl.height.baseVal.value;

    var radius = Math.min(width, height)/2;
    var labelSize = radius / 4;
    var position = [radius, radius];

    var value = 1;
    var saturation = 1;
    var labelPadding = radius * 0.020;
    var colorsNumber = 24;

    var m23 = 2 / 3;

    drawWheel(wheelEl, generateWheel(colorsNumber, saturation, value), 0, radius, labelSize);
    var innerRadius = radius - labelSize - labelPadding;
    drawWheel(wheelEl, generateWheel(colorsNumber, saturation * m23 * m23, value + (1 - value) / 3), radius - innerRadius, innerRadius, labelSize);
    innerRadius = innerRadius - labelSize - labelPadding;
    drawWheel(wheelEl, generateWheel(colorsNumber, saturation / 3.5, value + (1- value) * m23), radius - innerRadius, innerRadius, labelSize);

    var centerRadius = innerRadius - labelSize - labelPadding;
    drawCircle(wheelEl, colorsNumber, "ffffff", radius-centerRadius, centerRadius);
}

function calcSegmentStartPosition(radius, segment, segments, endSegment, roffset) {
    var labelPadding = 0.05;

    if (roffset === undefined) 
        roffset = 0;

    var padding = labelPadding;
    if (endSegment)
        padding = -padding;

    var angle = (segment - 1/2 + padding) / segments * 2 * Math.PI  - Math.PI / 2;

    var x = Math.cos(angle) * radius + radius + roffset;
    var y = Math.sin(angle) * radius + radius + roffset;
    return [x, y];
}


function drawCircle(wheelEl, colorsNumber, color, offset, radius) {
    var center = offset+radius;
    for (var i = 0; i < colorsNumber; i++) {
        var outerCircleStart = calcSegmentStartPosition(radius, i, colorsNumber, false, offset);
        var outerCircleEnd = calcSegmentStartPosition(radius, i+1, colorsNumber, true, offset);

        var path = "";
        path += "M " + outerCircleStart.join(" ");
        path += "A " + [radius, radius, 0, 0, 1].join(" ") + " " + outerCircleEnd.join(" ");
        path += "L " + [center, center].join(" ");

        var colorEl = document.createElementNS(
            "http://www.w3.org/2000/svg",
            'path');
        colorEl.setAttribute("fill", "#" + color);
        colorEl.setAttribute("d", path);
        wheelEl.appendChild(colorEl);
    }
}

function drawWheel(wheelEl, wheel, offset, radius, labelSize) {
    var innerRadius = radius - labelSize;
    var segments = wheel.length
    for (var is in wheel) {
        var i = parseInt(is);
        var icoffset = radius-innerRadius + offset;
        var outerCircleStart = calcSegmentStartPosition(radius, i, segments, false, offset);
        var outerCircleEnd = calcSegmentStartPosition(radius, i+1, segments, true, offset);
        var innerCircleEnd  = calcSegmentStartPosition(innerRadius, i+1, segments, true, icoffset);
        var innerCircleStart  = calcSegmentStartPosition(innerRadius, i, segments, false, icoffset);

        var path = "";
        path += "M " + outerCircleStart.join(" ");
        path += "A " + [radius, radius, 0, 0, 1].join(" ") + " " + outerCircleEnd.join(" ");
        path += "L " + innerCircleEnd.join(" ");
        path += "A " + [innerRadius, innerRadius, 0, 0, 0].join(" ") + " " + innerCircleStart.join(" ");

        var colorEl = document.createElementNS(
            "http://www.w3.org/2000/svg",
            'path');
        colorEl.setAttribute("fill", "#" + wheel[i]);
        colorEl.setAttribute("d", path);
        wheelEl.appendChild(colorEl);
    }
}
