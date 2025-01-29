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

let g_globalYAngle = 0;
let g_globalXAngle = 0;

let g_leftLegAngle = 0;
let g_rightLegAngle = 0;
let g_bodyAngle = 0;
let g_maxBodyAngle = 80;
let g_facePlateAngle = 0;

let g_tongueBaseX = 10;
let g_tongueBaseY = 0;
let g_tongueMiddleX = 0;
let g_tongueMiddleY = 0;
let g_tongueTipX = 0;
let g_tongueTipY = 0;


let g_animated = false;

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
        g_globalYAngle = ev.target.value;
        renderAllShapes();
    });
    
    document.getElementById("angleXSlide").addEventListener('mousemove', function(ev) {
        g_globalXAngle = ev.target.value;
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
        g_maxBodyAngle = ev.target.max;
        renderAllShapes();
    });

    document.getElementById("facePlateSlide").addEventListener('mousemove', function(ev) {
        g_facePlateAngle = ev.target.value;
        renderAllShapes();
    });

    document.getElementById("tongueBaseXSlide").addEventListener('mousemove', function(ev) {
        g_tongueBaseX = ev.target.value;
        renderAllShapes();
    });

    document.getElementById("tongueBaseYSlide").addEventListener('mousemove', function(ev) {
        g_tongueBaseY = ev.target.value;
        renderAllShapes();
    });

    document.getElementById("tongueMiddleXSlide").addEventListener('mousemove', function(ev) {
        g_tongueMiddleX = ev.target.value;
        renderAllShapes();
    });

    document.getElementById("tongueMiddleYSlide").addEventListener('mousemove', function(ev) {
        g_tongueMiddleY = ev.target.value;
        renderAllShapes();
    });

    document.getElementById("tongueTipXSlide").addEventListener('mousemove', function(ev) {
        g_tongueTipX = ev.target.value;
        renderAllShapes();
    });

    document.getElementById("tongueTipYSlide").addEventListener('mousemove', function(ev) {
        g_tongueTipY = ev.target.value;
        renderAllShapes();
    });

    document.getElementById("animate").addEventListener("click", function(ev) {
        g_animated = true;
    });

    document.getElementById("stopAnimate").addEventListener("click", function(ev) {
        g_animated = false;
        renderAllShapes();
    });

    document.getElementById("webgl").addEventListener("click", shiftClick);
    document.getElementById("webgl").addEventListener("mousemove", click);
}

function click(ev) {
    if (ev.buttons == 1 && !ev.shiftKey) {
        let coords = convertCoordinates(ev);
        g_globalYAngle = coords.x * 180 * -1;
        g_globalXAngle = coords.y * 180;

        document.getElementById("angleSlide").value = g_globalYAngle;
        document.getElementById("angleXSlide").value = g_globalXAngle;
    }
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

    tick();
}

var g_startTime = performance.now() / 1000.0;
var g_seconds = performance.now() / 1000.0 - g_startTime;

var g_pokeAnimation = false;
var g_pokeStartTime = 0;
var g_pokeSeconds = 0;
var g_pokeDuration = 2;

function tick() {
    g_seconds = performance.now() / 1000.0 - g_startTime;
    renderAllShapes();
    requestAnimationFrame(tick);
}

function shiftClick(ev) {
    if(ev.shiftKey) {
        // Start poke animation
        g_pokeAnimation = true;
        g_pokeStartTime = performance.now() / 1000.0;
        console.log("Poke animation started");
    }
}

function renderAllShapes() {
    let peformance = performance.now();

    if (g_animated && !g_pokeAnimation) {
        g_leftLegAngle = 45 * Math.sin(g_seconds * 5);
        g_rightLegAngle = -45 * Math.sin(g_seconds * 5);
        g_bodyAngle = Math.abs(5 * Math.sin(g_seconds * 5));
        g_facePlateAngle = 10 * Math.sin(g_seconds * 5);
        document.getElementById("rightLegSlide").value = g_rightLegAngle;
        document.getElementById("leftLegSlide").value = g_leftLegAngle;
        document.getElementById("bodySlide").value = g_bodyAngle;
        document.getElementById("facePlateSlide").value = g_facePlateAngle;
    }

    if(g_pokeAnimation){
        g_pokeSeconds = performance.now() / 1000.0 - g_pokeStartTime;
        let pokePortion = g_pokeSeconds / g_pokeDuration;
        let mouthOpenLength = 0.1
        // let swirlPortion = g_pokeSeconds / (g_pokeDuration - 2*mouthOpenLength);
        if(g_pokeSeconds > g_pokeDuration){
            g_pokeAnimation = false;
            g_pokeSeconds = 0;
            g_bodyAngle = 0;
        }else{
            // Set the body angle to completely open at the start of the animation, then close it at the end
            if(pokePortion < mouthOpenLength){
                g_bodyAngle = 80 * (pokePortion * 1/mouthOpenLength);
            }else if(pokePortion > 1 - mouthOpenLength){
                g_bodyAngle = 80 * ((1 - pokePortion) * 1/mouthOpenLength);
            }
            // Make the tongue move in a wave pattern both horizontally and vertically
            g_tongueBaseX = 10 + (10 * Math.sin(pokePortion *  Math.PI));
            g_tongueMiddleX = 20 * Math.sin(pokePortion * 2 * Math.PI);
            g_tongueTipX = 20 * Math.sin(pokePortion * 2 * Math.PI);

            g_tongueBaseY = 20 * Math.sin(pokePortion * 4 * Math.PI);
            g_tongueMiddleY = 20 * Math.sin(pokePortion * 4 * Math.PI);
            g_tongueTipY = 20 * Math.sin(pokePortion * 4 * Math.PI);
        }

        document.getElementById("bodySlide").value = g_bodyAngle;
        document.getElementById("tongueBaseXSlide").value = g_tongueBaseX;
        document.getElementById("tongueBaseYSlide").value = g_tongueBaseY;
        document.getElementById("tongueMiddleXSlide").value = g_tongueMiddleX;
        document.getElementById("tongueMiddleYSlide").value = g_tongueMiddleY;
        document.getElementById("tongueTipXSlide").value = g_tongueTipX;
        document.getElementById("tongueTipYSlide").value = g_tongueTipY;
    }

    // Clear <canvas>
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    
    var globalRotateMatrix = new Matrix4();
    globalRotateMatrix.rotate(g_globalYAngle, 0, 1, 0);
    globalRotateMatrix.rotate(g_globalXAngle, 1, 0, 0);
    gl.uniformMatrix4fv(u_GlobalRotateMatrix, false, globalRotateMatrix.elements);

    let openAmount = g_bodyAngle / g_maxBodyAngle;
    let tongueProportion = 0;
    // Scale open amount to tongue proportion so that tongue proportion is 1 when open amount is 0.5
    if (openAmount < 0.5) {
        tongueProportion = 2 * openAmount;
    } else {
        tongueProportion = 1;
    }
    let tongueSegmentLength = 0.45 * tongueProportion;
    let tongueSegmentWidth = 0.1 * tongueProportion;
    let tongueSegments = 6;
    var tongueBase = new Cylinder(tongueSegments);
    tongueBase.color = [.8, 0.0, 0.0, 1.0];
    tongueBase.matrix.translate(0, -0.2, 0.25);
    tongueBase.matrix.rotate(-90, 1, 0, 0);
    tongueBase.matrix.rotate(g_tongueBaseX, 1, 0, 0);
    tongueBase.matrix.rotate(g_tongueBaseY, 0, 0, 1);
    let baseCoords = new Matrix4(tongueBase.matrix);
    tongueBase.matrix.scale(tongueSegmentWidth, tongueSegmentLength, tongueSegmentWidth);
    tongueBase.render();

    var tongueMiddle = new Cylinder(tongueSegments);
    tongueMiddle.color = [.6, 0.0, 0.0, 1.0];
    tongueMiddle.matrix = new Matrix4(baseCoords);
    tongueMiddle.matrix.translate(0, tongueSegmentLength, 0);
    tongueMiddle.matrix.rotate(g_tongueMiddleX, 1, 0, 0);
    tongueMiddle.matrix.rotate(g_tongueMiddleY, 0, 0, 1);
    let middleCoords = new Matrix4(tongueMiddle.matrix);
    tongueMiddle.matrix.scale(tongueSegmentWidth*0.8, tongueSegmentLength, tongueSegmentWidth*0.8);
    tongueMiddle.render()

    var tongueTip = new Cylinder(tongueSegments);
    tongueTip.color = [.4, 0.0, 0.0, 1.0];
    tongueTip.matrix = new Matrix4(middleCoords);
    tongueTip.matrix.translate(0, tongueSegmentLength, 0);
    tongueTip.matrix.rotate(g_tongueTipX, 1, 0, 0);
    tongueTip.matrix.rotate(g_tongueTipY, 0, 0, 1);
    tongueTip.matrix.scale(tongueSegmentWidth*0.6, tongueSegmentLength, tongueSegmentWidth*0.6);
    tongueTip.render()

    var topBody = new Cube();
    topBody.color = [1.0, 0.0, 0.0, 1.0];
    topBody.matrix.translate(0, -0.2, 0.25);
    topBody.matrix.rotate(g_bodyAngle, 1, 0, 0);
    var bodyCoords = new Matrix4(topBody.matrix);
    topBody.matrix.translate(0, 0.4, -0.25);
    topBody.matrix.scale(.8, 0.8, .5);
    topBody.render();

    var topPack = new Cube();
    topPack.color = [1.0, 0.0, 0.0, 1.0];
    topPack.matrix = new Matrix4(bodyCoords);
    topPack.matrix.translate(0, 0.3, 0.1);
    topPack.matrix.scale(.6, .6, .2);
    topPack.render();

    var facePlate = new Cube();
    facePlate.matrix = new Matrix4(bodyCoords);
    facePlate.color = [0, 0.0, 1.0, 1.0];
    facePlate.matrix.translate(0, 0.5, -0.5);
    facePlate.matrix.rotate(g_facePlateAngle, 0, 0, 1);
    facePlate.matrix.scale(.6, .3, .2);
    facePlate.render();

    var bottomBody = new Cube();
    bottomBody.color = [1.0, 0.0, 0.0, 1.0];
    bottomBody.matrix.translate(0, -0.3, 0);
    bottomBody.matrix.scale(.8, 0.2, .5);
    bottomBody.render();

    var bottomPack = new Cube();
    bottomPack.color = [1.0, 0.0, 0.0, 1.0];
    bottomPack.matrix.translate(0, -0.25, .35);
    bottomPack.matrix.scale(.6, 0.15, .2);
    bottomPack.render();

    var rightLeg = new Cube();
    rightLeg.color = [.8, 0.0, 0.0, 1.0];
    rightLeg.matrix.translate(0.225, -0.40, 0);
    rightLeg.matrix.rotate(g_rightLegAngle, 1, 0, 0);
    rightLeg.matrix.translate(0, -0.175, 0);
    rightLeg.matrix.scale(.3, .4, .3);
    rightLeg.render();

    var leftLeg = new Cube();
    leftLeg.color = [.8, 0.0, 0.0, 1.0];
    leftLeg.matrix.translate(-0.225, -0.40, 0);
    leftLeg.matrix.rotate(g_leftLegAngle, 1, 0, 0);
    leftLeg.matrix.translate(0, -0.175, 0);
    leftLeg.matrix.scale(.3, .4, .3);
    leftLeg.render();

}

function sendTextToHTML(text, id) {
    var htmlElm = document.getElementById(id);
    if (!htmlElm) {
        console.log(`Failed to get the storage location of ${id}`);
        return;
    }
    htmlElm.innerHTML = text;
}