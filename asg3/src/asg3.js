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
    uniform sampler2D u_Sampler0; // Sky image
    uniform sampler2D u_Sampler1; // Coordiate plane
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
        }else if (u_whichtexture == 1) {
            gl_FragColor = texture2D(u_Sampler1, v_UV);   
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
let u_Sampler1;
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
let g_rotationModiefier = 3;

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

    // Get the storage location of the sampler
    u_Sampler1 = gl.getUniformLocation(gl.program, 'u_Sampler1');
    if (!u_Sampler1) {
        console.log('Failed to get the storage location of u_Sampler1');
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

function initTextures(src, sampler, textureNum) {
    var image = new Image();  // Create the image object
    if (!image) {
      console.log('Failed to create the image object');
      return false;
    }
    // Register the event handler to be called on loading an image
    image.onload = function(){ sendTextureToShader(image, sampler, textureNum); };
    // Tell the browser to load an image
    console.log(src);
    image.src = src;
  
    return true;
  }
  
  function sendTextureToShader(image, sampler, textureNum) {
    var texture = gl.createTexture();   // Create a texture object
    if (!texture) {
      console.log('Failed to create the texture object');
      return false;
    }

    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1); // Flip the image's y axis
    // Enable texture textureNum
    // This line was created by chatgpt when asked I could convert the original code to accept textureNum as an argument
    gl.activeTexture(gl['TEXTURE' + textureNum]);
    // Bind the texture object to the target
    gl.bindTexture(gl.TEXTURE_2D, texture);
  
    // Set the texture parameters
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    // Set the texture image
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);
    
    // Set the texture unit 0 to the sampler
    gl.uniform1i(sampler, textureNum);
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

    initTextures('../resources/walls.png', u_Sampler0, 0);
    initTextures('../resources/coordiatePlane.png', u_Sampler1, 1);

    addActionsForHtmlUI();

    // Specify the color for clearing <canvas>
    gl.clearColor(0.0, 0.0, 0.0, 1.0);

    cam = new Camera();
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

var cam;
function renderAllShapes() {
    // Clear <canvas>
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // Define the projection matrix
    let projectionMatrix = new Matrix4();
    projectionMatrix.setPerspective(60, canvas.width / canvas.height, .1, 100);
    gl.uniformMatrix4fv(u_ProjectionMatrix, false, projectionMatrix.elements);

    // Define the view matrix
    let viewMatrix = new Matrix4();
    let viewArray = cam.fetchArray();
    viewMatrix.setLookAt(viewArray[0], viewArray[1], viewArray[2], viewArray[3], viewArray[4], viewArray[5], viewArray[6], viewArray[7], viewArray[8]);
    gl.uniformMatrix4fv(u_ViewMatrix, false, viewMatrix.elements);

    let floor = new Cube();
    floor.matrix = new Matrix4();
    floor.textureNum = -2;
    floor.color = [0.7, 0.7, 0.7, 1];
    floor.matrix.translate(-16, 0, -16);
    floor.matrix.scale(32, 0, 32);
    floor.render();

    let skyBox = new Cube();
    skyBox.matrix = new Matrix4();
    skyBox.textureNum = -2;
    skyBox.color = [0.52, 0.8, 0.92, 1];
    skyBox.colorReduction = 0;
    skyBox.matrix.translate(-50, -50, -50);
    skyBox.matrix.scale(100, 100, 100);
    skyBox.render();

    renderMap();
}

// The map is 32x32, and defines both the texture and the height of every pillar
// The first digit is the height, the second digit is the texture
// So, 10 is a wall with a height of 1 with texture 1, 22 is a wall with a height of 2, with texture 2.
// This limits the height of the walls to 9, and the number textures to 9, but that should be fine for this project - webgl only supports 16 textures anyway
let g_map = [
    [90, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 10],
    [00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00],
    [00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00],
    [00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00],
    [00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00],
    [00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00],
    [00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00],
    [00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00],
    [00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00],
    [00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00],
    [00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00],
    [00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00],
    [00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00],
    [00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00],
    [00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00],
    [00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 10, 10, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00],
    [00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 10, 10, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00],
    [00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00],
    [00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00],
    [00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00],
    [00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00],
    [00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00],
    [00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00],
    [00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00],
    [00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00],
    [00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00],
    [00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00],
    [00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00],
    [00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00],
    [00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00],
    [00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00],
    [10, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 10],
];

function renderMap() {
    for (let i = 0; i < g_map.length; i++) {
        for (let j = 0; j < g_map[i].length; j++) {
            // If the value is 0, then there is no wall, so we skip it
            if(g_map[i][j] === 0) {
                continue;
            }
            // The texture number is the last digit of the number, and the height is the first digit, so we can get them by dividing and getting the remainder
            let textureNum = g_map[i][j] % 10;
            let height = Math.floor(g_map[i][j] / 10);
            for(let k = 0; k < height; k++) {
                let wall = new Cube();
                wall.matrix = new Matrix4();
                wall.textureNum = textureNum;
                let x = g_map.length/2 - j - 1;
                let y = k;
                let z = g_map[0].length/2 - i - 1;
                wall.matrix.translate(x, k, z);
                wall.render();
            }
        }
    }
}

function keydown(ev) {
    if(ev.key == 'w') {
        cam.moveFwdOrBwd(g_moveStep);
    }
    if(ev.key == 's') {
        cam.moveFwdOrBwd(-g_moveStep);
    }
    if(ev.key == 'a') {
        cam.moveLOrR(g_moveStep);
    }
    if(ev.key == 'd') {
        cam.moveLOrR(-g_moveStep);
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
            cam.rotate(diffX / g_rotationModiefier, -diffY / g_rotationModiefier);
        }
    }
}

function sendTextToHTML(text, id) {
    let htmlElm = document.getElementById(id);
    if (!htmlElm) {
        console.log(`Failed to get the storage location of ${id}`);
        return;
    }
    htmlElm.innerHTML = text;
}