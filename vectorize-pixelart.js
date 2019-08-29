/*  Copyright © 2019 Sergii Zasenko

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

var PNG             = require('pngjs').PNG,
    ContourTracing  = require('./contour-tracing'),
    utils           = require('./utils');

const targetSize = 2 ** 23;

let fileEl = document.getElementById("inputImage");
fileEl.value = "";

let canvas = document.getElementById("canvas");
let resultEl = $("#result");
let bigFileCheckbox = document.getElementById("convertBigFile");

fileEl.addEventListener("input", (e) => {
    let file = fileEl.files[0];

    $(fileEl).next('.custom-file-label').html(file.name);

    if (file === null || file.type != "image/png") {
        fileEl.setCustomValidity("Please provide corrent PNG file");
        formEl.classList.add("was-validated");
        return;
    }

    if (file.size > 2 * 2 ** 10) {
        bigFileCheckbox.checked = false;
        $(bigFileCheckbox.parentNode).show();
    } else {
        bigFileCheckbox.checked = true;
        $(bigFileCheckbox.parentNode).hide();
    }

    fileEl.setCustomValidity("");
});

let formEl = document.getElementById("form");
formEl.addEventListener("submit", (e) => {
    e.preventDefault();
    if (formEl.checkValidity() == false) {
        e.stopPropagation();
    } else {
        convertFile(fileEl.files[0])
    }

    formEl.classList.add("was-validated");

});

function convertFile(file) {
    let reader = new FileReader();
    reader.onload = function(error, data) {
        let png = new PNG();
        png.parse(reader.result, () => {
            let image = new utils.PNGImageData(png);

            let pixelMultiplier = Math.sqrt(
                targetSize / (image.height * image.width));


            let svg = new utils.SVG(image.height, image.width, pixelMultiplier);
            let eps = new utils.EPS(image.height, image.width, pixelMultiplier);

            let svgHTML     = svg.header();
            let epsContent  = eps.header();

            let tracer = new ContourTracing(image);
            tracer.traceContours((contour, pixel) => {
                svgHTML += svg.path(contour, pixel);
                epsContent += eps.path(contour, pixel);
            })

            svgHTML += svg.footer();
            epsContent += eps.footer();

            // TODO: convert to EPS only on request
            let svgData = "data:image/svg+xml;base64," + btoa(svgHTML);
            $("#download-svg").attr("href", svgData);
            $("#download-svg").attr("download", file.name.replace(/\.[^/.]+$/, ".svg"));

            $("#download-eps").attr("href", "data:application/postscript;base64," + btoa(epsContent));
            $("#download-eps").attr("download", file.name.replace(/\.[^/.]+$/, ".eps"));

            canvas.setAttribute("src", svgData);
            resultEl.modal();
        });
    };

    reader.readAsArrayBuffer(file);
}
