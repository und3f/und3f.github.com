var rectanglas = [
    [1, 'квадрат'],
    [1.5, 'полтора квадрата'],
    [Math.sqrt(2), '√2'],
    [Math.sqrt(3), '√3'],
    [Math.sqrt(4), '√4'],
    [Math.sqrt(5), '√5'],
    [(1 + Math.sqrt(2)), 'серебрянный'],
    [(1 + Math.sqrt(5)) / 2, 'золотой'],
    [11/10, '11x10'],
    [6/5, '6x5'],
    [1.25, '1 и 1/4 квадрата']
];

function find_dimension_error(dimension, d) {
    var error = 1 - dimension[0] / (d[0]/d[1]);
    return error;
}

function size2dimension(w,h) {
    var d = [w,h].sort(function(a,b) {b > a});

    var rectangle = rectanglas[0];
    var error = find_dimension_error(rectanglas[0], d);

    for (var i = 1; i < rectanglas.length; i++) {
        var test_rectangle = rectanglas[i];
        var test_error = find_dimension_error(test_rectangle, d);
        if (Math.abs(test_error) < Math.abs(error)) {
            error = test_error;
            rectangle = test_rectangle;
        }
    }

    error = (Math.round(error * 1000.0))/10.0;
    error += "%";
    return [rectangle[1], error];
}

function show_dimension(name,w,h) {
    var r = size2dimension(w,h);

    document.getElementById('art-name').textContent = name;
    document.getElementById('art-dimension').textContent = r[0];
    document.getElementById('art-dimension-error').textContent = r[1];
}

function process_image_file(image_file) {
    var i = new Image();

    i.onload = function(){
        show_dimension(this.name, this.width, this.height);
        URL.revokeObjectURL(this.src);
    }

    i.name=image_file.name;
    i.src=URL.createObjectURL(image_file);
}
