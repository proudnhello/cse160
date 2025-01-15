// ColoredPoint.js (c) 2012 matsuda
// Vertex shader program
var VSHADER_SOURCE =
    `attribute vec4 a_Position;
    uniform float u_PointSize;
    void main() {
        gl_Position = a_Position;
        gl_PointSize = u_PointSize;
    }`;

// Fragment shader program
var FSHADER_SOURCE =
    `precision mediump float;
    uniform vec4 u_FragColor;
    void main() {
        gl_FragColor = u_FragColor;
    }`;

const POINT = 0;
const TRIANGLE = 1;
const CIRCLES = 2;

let canvas;
let gl;
let a_Position;
let u_PointSize;
let u_FragColor;
let g_selectedColor = [1.0, 1.0, 1.0, 1.0];
let u_selectedSize = 10;
let g_shapes = [];
let g_selectedType = POINT;
let g_segments = 5;

function setupWebGL() {
    // Retrieve <canvas> element
    canvas = document.getElementById('webgl');

    // Get the rendering context for WebGL
    gl = canvas.getContext("webgl", {preserveDrawingBuffer: true});
    if (!gl) {
        console.log('Failed to get the rendering context for WebGL');
        return;
    }
}

function connectVariablesToGLSL() {
    // Initialize shaders
    if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
        console.log('Failed to intialize shaders.');
        return;
    }

    // Get the storage location of a_Position
    a_Position = gl.getAttribLocation(gl.program, 'a_Position');
    if (a_Position < 0) {
        console.log('Failed to get the storage location of a_Position');
        return;
    }

    // Get the storage location of u_PointSize
    u_PointSize = gl.getUniformLocation(gl.program, 'u_PointSize');
    if (u_PointSize < 0) {
        console.log('Failed to get the storage location of u_PointSize');
        return;
    }

    // Get the storage location of u_FragColor
    u_FragColor = gl.getUniformLocation(gl.program, 'u_FragColor');
    if (!u_FragColor) {
        console.log('Failed to get the storage location of u_FragColor');
        return;
    }
}

// This hex function heavily based on the one from https://stackoverflow.com/questions/5623838/rgb-to-hex-and-hex-to-rgb
// There didn't seem to be a built-in function in JavaScript to convert hex to rgb, and I do not like regex, so I found this
function hexToRgb(hex) {
    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    let r = result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16),
    } : null;
    if (r == null) {
        console.log('Failed to convert hex to rgb');
        return [1.0, 1.0, 1.0, 1.0];
    }
    return [r.r / 255.0, r.g / 255.0, r.b / 255.0, 1.0];
}
// Copied function ends here

function addActionsForHtmlUI() {
    // Button events
    document.getElementById('clear').onclick = function() {
        g_shapes = [];
        renderAllShapes();
    };

    document.getElementById('points').onclick = function() {
        g_selectedType = POINT;
    }

    document.getElementById('triangles').onclick = function() {
        g_selectedType = TRIANGLE;
    }

    document.getElementById('circles').onclick = function() {
        g_selectedType = CIRCLES;
    }

    // Slider events 
    document.getElementById('red').addEventListener('mouseup', function() {
        g_selectedColor[0] = this.value;
    });
    document.getElementById('green').addEventListener('mouseup', function() {
        g_selectedColor[1] = this.value;
    });
    document.getElementById('blue').addEventListener('mouseup', function() {
        g_selectedColor[2] = this.value;
    });

    document.getElementById('size').addEventListener('mouseup', function() {
        u_selectedSize = this.value;
    });

    document.getElementById('segments').addEventListener('mouseup', function() {
        g_segments = this.value;
    });

    // Color picker event
    document.getElementById('color').addEventListener("input", function() {
        g_selectedColor = hexToRgb(this.value);
    });
}

function convertCoordinates(ev) {
    const x = ev.clientX; // x coordinate of a mouse pointer
    const y = ev.clientY; // y coordinate of a mouse pointer
    const rect = ev.target.getBoundingClientRect();

    return {
        x: ((x - rect.left) - canvas.width/2)/(canvas.width/2),
        y: (canvas.height/2 - (y - rect.top))/(canvas.height/2)
    };
}

function main() {
    setupWebGL();

    connectVariablesToGLSL();

    addActionsForHtmlUI();

    // Register function (event handler) to be called on a mouse press
    canvas.onmousedown = click;
    canvas.onmousemove = function(ev) {
        if (ev.buttons == 1) {
            click(ev);
        }
    };

    // Specify the color for clearing <canvas>
    gl.clearColor(0.0, 0.0, 0.0, 1.0);

    // Clear <canvas>
    gl.clear(gl.COLOR_BUFFER_BIT);
}

function click(ev) {
    [x, y] = [convertCoordinates(ev).x, convertCoordinates(ev).y];

    // Store the coordinates to g_points array
    switch (g_selectedType) {
        case POINT:
            g_shapes.push(new Point([x, y], g_selectedColor, u_selectedSize));
            break;
        case TRIANGLE:
            g_shapes.push(new Triangle([x, y], g_selectedColor, u_selectedSize));
            break;
        case CIRCLES:
            g_shapes.push(new Circle([x, y], g_selectedColor, u_selectedSize, g_segments));
            break;
    }
    renderAllShapes();
}

function renderAllShapes() {
    let peformance = performance.now();

    // Clear <canvas>
    gl.clear(gl.COLOR_BUFFER_BIT);

    var len = g_shapes.length;
    for(var i = 0; i < len; i++) {
        g_shapes[i].render();
    }

    let dur = performance.now() - peformance;
    sendTextToHTML(`numdot: ${g_shapes.length}, ms: ${Math.floor(dur)}`, "numdot");
}

function sendTextToHTML(text, id) {
    var htmlElm = document.getElementById(id);
    if (!htmlElm) {
        console.log(`Failed to get the storage location of ${id}`);
        return;
    }
    htmlElm.innerHTML = text;
}