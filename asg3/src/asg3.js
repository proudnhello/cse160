// ColoredPoint.js (c) 2012 matsuda
// Help on enabling aphla blending from https://delphic.me.uk/tutorials/webgl-alpha 
// Converting hex to rgb function from https://stackoverflow.com/questions/5623838/rgb-to-hex-and-hex-to-rgb
// Vertex shader program
let VSHADER_SOURCE =
    `attribute vec4 a_Position;
    uniform float u_PointSize;
    uniform mat4 u_ModelMatrix;
    uniform mat4 u_GlobalRotateMatrix;
    uniform mat4 u_ViewMatrix;
    uniform mat4 u_ProjectionMatrix;
    attribute vec2 a_UV;
    varying vec2 v_UV;
    void main() {
        gl_Position = u_ProjectionMatrix * u_ViewMatrix * u_GlobalRotateMatrix * u_ModelMatrix * a_Position;
        gl_PointSize = u_PointSize;
        v_UV = a_UV;
    }`;

// Fragment shader program
let FSHADER_SOURCE =
    `precision mediump float;
    uniform vec4 u_FragColor;
    uniform sampler2D u_Sampler0;
    varying vec2 v_UV;
    uniform int u_whichtexture;
    void main() {
        // Use a color
        if (u_whichtexture == -2) {
            gl_FragColor = u_FragColor;
        // Use a debug texture that maps the UV coordinates to RGB
        } else if (u_whichtexture == -1) {
            gl_FragColor = vec4(v_UV, 1.0, 1.0);
        // Use texture 0
        } else if (u_whichtexture == 0) {
            gl_FragColor = texture2D(u_Sampler0, v_UV);
        // Use error purple
        }else{
            gl_FragColor = vec4(1.0, 0, 0.87, 1.0);
        }
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
let a_UV;
let v_UV;
let u_Sampler0;
let u_whichtexture;
let g_selectedColor = [1.0, 1.0, 1.0, 1.0];
let u_selectedSize = 10;
let g_shapes = [];
let g_undoneShapes = [];
let g_selectedType = POINT;
let g_segments = 5;
let g_currentShape = [];

let g_globalYAngle = 0;
let g_globalXAngle = 0;
let g_moveStep = 0.1;
let g_rotationModiefier = 100;

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

    // Get the storage location the uv variables
    a_UV = gl.getAttribLocation(gl.program, 'a_UV');
    if (a_UV < 0) {
        console.log('Failed to get the storage location of a_UV');
        return;
    }

    // Get the storage location of the sampler
    u_Sampler0 = gl.getUniformLocation(gl.program, 'u_Sampler0');
    if (!u_Sampler0) {
        console.log('Failed to get the storage location of u_Sampler0');
        return;
    }

    // Get the storage location of the which texture variable
    u_whichtexture = gl.getUniformLocation(gl.program, 'u_whichtexture');
    if (!u_whichtexture) {
        console.log('Failed to get the storage location of u_whichtexture');
        return;
    }

    // Get the storage location of the view matrix
    u_ViewMatrix = gl.getUniformLocation(gl.program, 'u_ViewMatrix');
    if (!u_ViewMatrix) {
        console.log('Failed to get the storage location of u_ViewMatrix');
        return;
    }

    // Get the storage location of the projection matrix
    u_ProjectionMatrix = gl.getUniformLocation(gl.program, 'u_ProjectionMatrix');
    if (!u_ProjectionMatrix) {
        console.log('Failed to get the storage location of u_ProjectionMatrix');
        return;
    }

    let identityM = new Matrix4();
    gl.uniformMatrix4fv(u_ModelMatrix, false, identityM.elements);
    identityM = new Matrix4();
    gl.uniformMatrix4fv(u_GlobalRotateMatrix, false, identityM.elements);
}

function initTextures() {
    var image = new Image();  // Create the image object
    if (!image) {
      console.log('Failed to create the image object');
      return false;
    }
    // Register the event handler to be called on loading an image
    image.onload = function(){ sendTextureToShader(image); };
    // Tell the browser to load an image
    image.src = '../resources/sky.jpg';
  
    return true;
  }
  
  function sendTextureToShader(image) {
    var texture = gl.createTexture();   // Create a texture object
    if (!texture) {
      console.log('Failed to create the texture object');
      return false;
    }

    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1); // Flip the image's y axis
    // Enable texture unit0
    gl.activeTexture(gl.TEXTURE0);
    // Bind the texture object to the target
    gl.bindTexture(gl.TEXTURE_2D, texture);
  
    // Set the texture parameters
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    // Set the texture image
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);
    
    // Set the texture unit 0 to the sampler
    gl.uniform1i(u_Sampler0, 0);
  }
  

// This hex function heavily based on the one from https://stackoverflow.com/questions/5623838/rgb-to-hex-and-hex-to-rgb
// There didn't seem to be a built-in function in JavaScript to convert hex to rgb, and I do not like regex, so I found this
function hexToRgb(hex) {
    let result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
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
    document.getElementById("webgl").addEventListener("click", shiftClick);
    document.getElementById("webgl").addEventListener("mousemove", click);
    document.getElementById("webgl").addEventListener("mouseup", function(ev) {
        lastX = -1;
        lastY = -1;
    });
    document.onkeydown = keydown;
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

    initTextures(gl, 0);

    addActionsForHtmlUI();

    // Specify the color for clearing <canvas>
    gl.clearColor(0.0, 0.0, 0.0, 1.0);

    // Clear <canvas>
    gl.clear(gl.COLOR_BUFFER_BIT);
    renderAllShapes();

    tick();
}

let g_startTime = performance.now() / 1000.0;
let g_seconds = performance.now() / 1000.0 - g_startTime;
let g_time = g_startTime;

let frameTracker = [];
function tick() {
    g_seconds = performance.now() / 1000.0 - g_startTime;
    renderAllShapes();
    let duration = performance.now() - g_time;
    g_time = performance.now();
    frameTracker.push(duration);
    if(frameTracker.length > 50){
        frameTracker.shift();
    }
    let average = 0;
    frameTracker.forEach((frame) => {
        average += frame;
    });
    average /= frameTracker.length;
    sendTextToHTML('FPS = ' + Math.floor(1000 / average), 'numdot');
    requestAnimationFrame(tick);
}

function shiftClick(ev) {
    if(ev.shiftKey) {
        // Start poke animation
        g_pokeAnimation = true;
        g_pokeStartTime = performance.now() / 1000.0;
    }
}

var g_eye = new Vector3([0, 0, 3])
var g_lookat = new Vector3([0, 0, -100])
var g_up = new Vector3([0, 1, 0])
function renderAllShapes() {
    // Clear <canvas>
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // Define the projection matrix
    let projectionMatrix = new Matrix4();
    projectionMatrix.setPerspective(60, canvas.width / canvas.height, .1, 100);
    gl.uniformMatrix4fv(u_ProjectionMatrix, false, projectionMatrix.elements);

    // Define the view matrix
    let viewMatrix = new Matrix4();
    viewMatrix.setLookAt(
        g_eye.elements[0], 
        g_eye.elements[1], 
        g_eye.elements[2], 
        g_lookat.elements[0], 
        g_lookat.elements[1], 
        g_lookat.elements[2], 
        g_up.elements[0], 
        g_up.elements[1], 
        g_up.elements[2]);
    gl.uniformMatrix4fv(u_ViewMatrix, false, viewMatrix.elements);

    // Define the rotation matrix
    let globalRotateMatrix = new Matrix4();
    globalRotateMatrix.rotate(g_globalYAngle, 0, 1, 0);
    globalRotateMatrix.rotate(g_globalXAngle, 1, 0, 0);
    gl.uniformMatrix4fv(u_GlobalRotateMatrix, false, globalRotateMatrix.elements);

    let textureTest = new Cube();
    textureTest.textureNum = 0;
    textureTest.matrix = new Matrix4(globalRotateMatrix);
    textureTest.render();
}

function keydown(ev) {
    if(ev.key == 'w') {
        moveFwdOrBwd(g_moveStep);
    }
    if(ev.key == 's') {
        moveFwdOrBwd(-g_moveStep);
    }
    if(ev.key == 'a') {
        moveLOrR(g_moveStep);
    }
    if(ev.key == 'd') {
        moveLOrR(-g_moveStep);
    }
}

let lastX = -1;
let lastY = -1;
function click(ev) {
    if (ev.buttons == 1) {
        if(lastX == -1) {
            lastX = ev.clientX;
            lastY = ev.clientY;
        }else{
            let diffX = ev.clientX - lastX;
            let diffY = ev.clientY - lastY;
            lastX = ev.clientX;
            lastY = ev.clientY;
            rotateY(diffX / g_rotationModiefier);
            rotateX(-diffY / g_rotationModiefier);
        }
    }
}

function fetchDirection() {
    let direction = new Vector3();
    direction.set(g_lookat);
    direction.sub(g_eye);
    direction.normalize();
    return direction;
}

function moveFwdOrBwd(amount) {
    let direction = fetchDirection();
    direction.mul(amount);
    g_eye.add(direction);
    g_lookat.add(direction);
}

function moveLOrR(amount) {
    let direction = fetchDirection();
    let left = Vector3.cross(direction, g_up);
    left.normalize();
    left.mul(amount);
    g_eye.sub(left);
    g_lookat.sub(left);
}

function rotateY(angle) {
    let atp = new Vector3();
    atp.set(g_lookat);
    atp.sub(g_eye);
    // I'll be ignoring the y component for now, as we're rotating around the y axis
    atp.elements[1] = 0;
    let r = atp.magnitude();
    let theta = Math.atan2(atp.elements[2], atp.elements[0]);
    theta += angle;
    g_lookat.elements[0] = g_eye.elements[0] + r * Math.cos(theta);
    g_lookat.elements[2] = g_eye.elements[2] + r * Math.sin(theta);
}

function rotateX(angle) {
    let atp = new Vector3();
    atp.set(g_lookat);
    atp.sub(g_eye);

    // I'll be ignoring the x component , as we're rotating around the x axis
    atp.elements[0] = 0;
    let r = atp.magnitude();
    let theta = Math.atan2(atp.elements[2], atp.elements[1]);
    theta += angle;
    g_lookat.elements[1] = g_eye.elements[1] + r * Math.cos(theta);
    g_lookat.elements[2] = g_eye.elements[2] + r * Math.sin(theta);
}

function sendTextToHTML(text, id) {
    let htmlElm = document.getElementById(id);
    if (!htmlElm) {
        console.log(`Failed to get the storage location of ${id}`);
        return;
    }
    htmlElm.innerHTML = text;
}