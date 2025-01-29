// ColoredPoint.js (c) 2012 matsuda
// Help on enabling aphla blending from https://delphic.me.uk/tutorials/webgl-alpha 
// Converting hex to rgb function from https://stackoverflow.com/questions/5623838/rgb-to-hex-and-hex-to-rgb
// Vertex shader program
var VSHADER_SOURCE =
    `attribute vec4 a_Position;
    uniform float u_PointSize;
    uniform mat4 u_ModelMatrix;
    uniform mat4 u_GlobalRotateMatrix;
    void main() {
        gl_Position = u_GlobalRotateMatrix * u_ModelMatrix * a_Position;
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
let u_ModelMatrix;
let g_selectedColor = [1.0, 1.0, 1.0, 1.0];
let u_selectedSize = 10;
let g_shapes = [];
let g_undoneShapes = [];
let g_selectedType = POINT;
let g_segments = 5;
let g_currentShape = [];
let g_globalAngle = 0;

let g_leftLegAngle = 0;
let g_rightLegAngle = 0;
let g_bodyAngle = 0;

function setupWebGL() {
    // Retrieve <canvas> element
    canvas = document.getElementById('webgl');

    // Get the rendering context for WebGL
    gl = canvas.getContext("webgl", {preserveDrawingBuffer: true, premultipliedAlpha: false});  
    if (!gl) {
        console.log('Failed to get the rendering context for WebGL');
        return;
    }

    gl.enable(gl.DEPTH_TEST);
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

    // Get the storage location of u_ModelMatrix
    u_ModelMatrix = gl.getUniformLocation(gl.program, 'u_ModelMatrix');
    if (!u_ModelMatrix) {
        console.log('Failed to get the storage location of u_ModelMatrix');
        return;
    }

    // Get the storage location of u_GlobalRotateMatrix
    u_GlobalRotateMatrix = gl.getUniformLocation(gl.program, 'u_GlobalRotateMatrix');
    if (!u_GlobalRotateMatrix) {
        console.log('Failed to get the storage location of u_GlobalRotateMatrix');
        return;
    }

    var identityM = new Matrix4();
    gl.uniformMatrix4fv(u_ModelMatrix, false, identityM.elements);
    identityM = new Matrix4();
    gl.uniformMatrix4fv(u_GlobalRotateMatrix, false, identityM.elements);
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
    document.getElementById("angleSlide").addEventListener('mousemove', function(ev) {
        g_globalAngle = ev.target.value;
        renderAllShapes();
    });

    document.getElementById("rightLegSlide").addEventListener('mousemove', function(ev) {
        g_rightLegAngle = ev.target.value;
        renderAllShapes();
    });

    document.getElementById("leftLegSlide").addEventListener('mousemove', function(ev) {
        g_leftLegAngle = ev.target.value;
        renderAllShapes();
    });

    document.getElementById("bodySlide").addEventListener('mousemove', function(ev) {
        g_bodyAngle = ev.target.value;
        renderAllShapes();
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

    // Specify the color for clearing <canvas>
    gl.clearColor(0.0, 0.0, 0.0, 1.0);

    // Clear <canvas>
    gl.clear(gl.COLOR_BUFFER_BIT);
    renderAllShapes();
}

function click(ev) {
    return
}

function renderAllShapes() {
    let peformance = performance.now();

    // Clear <canvas>
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    
    var globalRotateMatrix = new Matrix4();
    globalRotateMatrix.rotate(g_globalAngle, 0, 1, 0);
    gl.uniformMatrix4fv(u_GlobalRotateMatrix, false, globalRotateMatrix.elements);

    var topBody = new Cube();
    topBody.color = [1.0, 0.0, 0.0, 1.0];
    topBody.matrix.translate(0, -0.2, 0.25);
    topBody.matrix.rotate(g_bodyAngle, 1, 0, 0);
    topBody.matrix.translate(0, 0.4, -0.25);
    topBody.matrix.scale(.8, 0.8, .5);
    topBody.render();

    var bottomBody = new Cube();
    bottomBody.color = [1.0, 0.0, 0.0, 1.0];
    bottomBody.matrix.translate(0, -0.3, 0);
    bottomBody.matrix.scale(.8, 0.2, .5);
    bottomBody.render();

    var facePlate = new Cube();
    facePlate.color = [0, 0.0, 1.0, 1.0];
    facePlate.matrix.translate(0, 0.25, -0.25);
    facePlate.matrix.scale(.6, .3, .2);
    facePlate.render();

    var rightLeg = new Cube();
    rightLeg.color = [1.0, 0.0, 0.0, 1.0];
    rightLeg.matrix.translate(0.225, -0.40, 0);
    rightLeg.matrix.rotate(g_rightLegAngle, 1, 0, 0);
    rightLeg.matrix.translate(0, -0.175, 0);
    rightLeg.matrix.scale(.3, .4, .3);
    rightLeg.render();

    var leftLeg = new Cube();
    leftLeg.color = [1.0, 0.0, 0.0, 1.0];
    leftLeg.matrix.translate(-0.225, -0.40, 0);
    leftLeg.matrix.rotate(g_leftLegAngle, 1, 0, 0);
    leftLeg.matrix.translate(0, -0.175, 0);
    leftLeg.matrix.scale(.3, .4, .3);
    leftLeg.render();

    let dur = performance.now() - peformance;
}

function sendTextToHTML(text, id) {
    var htmlElm = document.getElementById(id);
    if (!htmlElm) {
        console.log(`Failed to get the storage location of ${id}`);
        return;
    }
    htmlElm.innerHTML = text;
}