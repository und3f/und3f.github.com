/*  Copyright © 2019, 2023 Sergii Zasenko

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

'use strict'

const { PNG } = require('pngjs')
const {ContourTracing, PNGImageData, SVG, EPS} = require('vectorize-pixelart')

const targetSize = 2 ** 23

const fileElDD = document.getElementById('inputImageDD')

const fileEl = document.getElementById('inputImage')
fileEl.value = ''

const canvas = document.getElementById('canvas')
const resultEl = $('#result')
const bigFileCheckbox = document.getElementById('convertBigFile')

let inputImageFile

fileElDD.addEventListener('click', (e) => {
  fileEl.click()
})

fileElDD.addEventListener('drop', (e) => {
  e.preventDefault()
  setInputImageFile(e.dataTransfer.files[0])
  fileElDD.classList.remove('hover')
}, false)

fileElDD.addEventListener('dragover', (e) => {
  e.preventDefault()
  return false
}, false)

fileElDD.addEventListener('dragenter', function (event) {
  fileElDD.classList.add('hover')
}, false)

fileElDD.addEventListener('dragleave', function (event) {
  fileElDD.classList.remove('hover')
}, false)

fileEl.addEventListener('change', (e) => {
  setInputImageFile(fileEl.files[0])
})

function displayImageFile (file) {
  const imageEl = document.getElementById('inputImageDDDisplayer')

  if (file == null) {
    imageEl.setAttribute('src', '')
    return
  }

  const reader = new FileReader()

  reader.addEventListener('load', () => {
    imageEl.setAttribute('src', reader.result)
    fileElDD.classList.add('preview')
  }, false)

  reader.readAsDataURL(file)
}

function setInputImageFile (file) {
  fileEl.value = ''
  $(bigFileCheckbox.parentNode).hide()
  inputImageFile = null

  $(fileEl).next('.custom-file-label').html(file.name)

  if (file == null || file.type != 'image/png') {
    fileEl.setCustomValidity('Please provide correct PNG file')
    formEl.classList.add('was-validated')

    file = null
  }

  inputImageFile = file
  displayImageFile(file)
  if (file == null) { return }

  if (file.size > 2 * 2 ** 10) {
    bigFileCheckbox.checked = false
    $(bigFileCheckbox.parentNode).show()
  } else {
    bigFileCheckbox.checked = true
    $(bigFileCheckbox.parentNode).hide()
  }

  fileEl.setCustomValidity('')
}

const formEl = document.getElementById('form')
formEl.addEventListener('submit', (e) => {
  e.preventDefault()

  if (inputImageFile == null) {
    fileEl.setCustomValidity('Please provide pixel art image')
  }
  if (formEl.checkValidity() == false) {
    e.stopPropagation()
  } else {
    convertFile(inputImageFile)
  }

  formEl.classList.add('was-validated')
})

resultEl.on('hidden.bs.modal', () => {
  window.URL.revokeObjectURL($('#download-svg').attr('href'))
  window.URL.revokeObjectURL($('#download-eps').attr('href'))

  $('#download-svg').removeAttr('href')
  $('#download-eps').removeAttr('href')
})

function convertFile (file) {
  const reader = new FileReader()
  reader.onload = function (error, data) {
    const fileName = file.name || 'image.png'
    const png = new PNG()
    png.parse(reader.result, () => {
      const image = new PNGImageData(png)

      const svg = new SVG(image.height, image.width)
      const eps = new EPS(image.height, image.width)

      let svgHTML = svg.header()
      let epsContent = eps.header()

      const tracer = new ContourTracing(image)
      tracer.traceContours((contour, pixel) => {
        svgHTML += svg.path(contour, pixel)
        epsContent += eps.path(contour, pixel)
      })

      svgHTML += svg.footer()
      epsContent += eps.footer()

      // TODO: convert to EPS only on request
      const svgURL = window.URL.createObjectURL(new Blob([svgHTML], { type: 'image/svg+xml' }))
      const epsURL = window.URL.createObjectURL(new Blob([epsContent], { type: 'application/postscript' }))

      $('#download-svg').attr('href', svgURL)
      $('#download-svg').attr('download', fileName.replace(/\.[^/.]+$/, '.svg'))

      $('#download-eps').attr('href', epsURL)
      $('#download-eps').attr('download', fileName.replace(/\.[^/.]+$/, '.eps'))

      canvas.setAttribute('src', svgURL)
      resultEl.modal()
    })
  }

  reader.readAsArrayBuffer(file)
}
