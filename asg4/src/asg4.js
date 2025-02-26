// ColoredPoint.js (c) 2012 matsuda
// Converting hex to rgb function from https://stackoverflow.com/questions/5623838/rgb-to-hex-and-hex-to-rgb
// Textures, sound effects, and map from wolfenstein 3d

// Notes on performance
// With the current implementation, the program runs at about 40fps on my machine, with 9216 cubes on screen (32x32x9)
// In order to get the fps down to 10 as mentioned on the rubric, I need to have 327768 cubes on screen (32x32x32)
// So, while it would be possible to improve performance (combining cubes into a single buffer, for example), I don't think it's necessary
// Vertex shader program
let VSHADER_SOURCE =
    `attribute vec4 a_Position;
    uniform float u_PointSize;
    uniform mat4 u_ModelMatrix;
    uniform mat4 u_GlobalRotateMatrix;
    uniform mat4 u_ViewMatrix;
    uniform mat4 u_ProjectionMatrix;
    uniform mat4 u_NormalMatrix;
    uniform vec3 u_DiffuseLightColor;
    uniform vec3 u_AmbientLightColor;
    uniform bool u_lighting;
    uniform bool u_PointLight;
    attribute vec2 a_UV;
    attribute vec3 a_Normal;
    varying vec2 v_UV;
    varying vec3 v_Normal;
    varying vec4 v_Position;
    void main() {
        gl_Position = u_ProjectionMatrix * u_ViewMatrix * u_GlobalRotateMatrix * u_ModelMatrix * a_Position;
        gl_PointSize = u_PointSize;
        v_UV = a_UV;
        // v_Normal = a_Normal;
        v_Normal = normalize(vec3(u_NormalMatrix * vec4(a_Normal, 1.0)));
        v_Position = u_ModelMatrix * a_Position;
    }`;

// Fragment shader program
let FSHADER_SOURCE =
    `precision mediump float;
    uniform vec4 u_FragColor;
    uniform sampler2D u_Sampler0; 
    uniform sampler2D u_Sampler1;
    uniform sampler2D u_Sampler2;
    uniform sampler2D u_Sampler3;
    uniform sampler2D u_Sampler4;
    uniform sampler2D u_Sampler5;
    uniform sampler2D u_Sampler6;
    uniform sampler2D u_Sampler7;
    uniform bool u_lighting;
    uniform bool u_PointLight;
    uniform vec3 u_LightPosition;
    uniform vec3 u_cameraPosition;
    uniform vec3 u_DiffuseLightColor;
    uniform vec3 u_AmbientLightColor;
    varying vec2 v_UV;
    varying vec3 v_Normal;
    varying vec4 v_Position;
    uniform int u_whichtexture;
    void main() {
        // Use a debug texture for testing lighting
        if(u_whichtexture == -3){
            gl_FragColor = vec4((v_Normal + 1.0)/2.0, 1.0);
        // Use a color
        } else if (u_whichtexture == -2) {
            gl_FragColor = u_FragColor;
        // Use a debug texture that maps the UV coordinates to RGB
        } else if (u_whichtexture == -1) {
            gl_FragColor = vec4(v_UV, 1.0, 1.0);
        // Use texture 0
        } else if (u_whichtexture == 0) {
            gl_FragColor = texture2D(u_Sampler0, v_UV);
        }else if (u_whichtexture == 1) {
            gl_FragColor = texture2D(u_Sampler1, v_UV);   
        }else if (u_whichtexture == 2) {
            gl_FragColor = texture2D(u_Sampler2, v_UV);
        }else if (u_whichtexture == 3) {
            gl_FragColor = texture2D(u_Sampler3, v_UV);
        }else if (u_whichtexture == 4) {
            gl_FragColor = texture2D(u_Sampler4, v_UV);
        }else if (u_whichtexture == 5) {
            gl_FragColor = texture2D(u_Sampler5, v_UV);
        }else if (u_whichtexture == 6) {
            gl_FragColor = texture2D(u_Sampler6, v_UV);
        }else if (u_whichtexture == 7) {
            gl_FragColor = texture2D(u_Sampler7, v_UV);
        }else{
            gl_FragColor = vec4(1.0, 0, 0.87, 1.0);
        }


        vec3 specular = vec3(0.0, 0.0, 0.0);
        vec3 diffuse = vec3(0.0, 0.0, 0.0);
        vec3 ambient = vec3(0.0, 0.0, 0.0);

        // If the point light is on, calculate the diffuse and specular reflections
        if(u_PointLight){
            vec3 lightVector = u_LightPosition - vec3(v_Position);
            float distance = length(lightVector);

            // Calculate diffuse reflection
            vec3 L = normalize(lightVector);
            vec3 N = normalize(v_Normal);
            float nDotL = max(dot(N, L), 0.0);
            diffuse = u_DiffuseLightColor * vec3(gl_FragColor) * nDotL;

            // Calculate specular reflection
            vec3 R = reflect(-L, N);
            vec3 E = normalize(u_cameraPosition - vec3(v_Position));
            float s = pow(max(dot(R, E), 0.0), 50.0);
            specular = u_DiffuseLightColor * s;
        }

        if(u_lighting){
            // Calculate ambient reflection (such difficulty)
            ambient = u_AmbientLightColor * vec3(gl_FragColor);
        }

        if(u_lighting || u_PointLight){
            gl_FragColor = vec4(specular + diffuse + ambient, 1.0);
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
let a_Normal;
let v_Normal;
let u_Sampler0;
let u_Sampler1;
let u_Sampler2;
let u_Sampler3;
let u_Sampler4;
let u_Sampler5;
let u_Sampler6;
let u_Sampler7;
let u_NormalMatrix;
let u_DiffuseLightColor;
let u_AmbientLightColor;
let g_health = 100;
let u_whichtexture;
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
let g_normal = false;

let g_initialLight = [-0.5, 1.2, -24.0];
let g_lightModifier = [0, 0, 0];
let g_DiffuseLightColor = [1.0, 1.0, 1.0];
let g_AmbientLightColor = [0.3, 0.3, 0.3];

let u_cameraPosition;

let g_animated = true;

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

    u_Sampler2 = gl.getUniformLocation(gl.program, 'u_Sampler2');
    if (!u_Sampler2) {
        console.log('Failed to get the storage location of u_Sampler2');
        return;
    }

    u_Sampler3 = gl.getUniformLocation(gl.program, 'u_Sampler3');
    if (!u_Sampler3) {
        console.log('Failed to get the storage location of u_Sampler3');
        return;
    }

    u_Sampler4 = gl.getUniformLocation(gl.program, 'u_Sampler4');
    if (!u_Sampler4) {
        console.log('Failed to get the storage location of u_Sampler4');
        return;
    }

    u_Sampler5 = gl.getUniformLocation(gl.program, 'u_Sampler5');
    if (!u_Sampler5) {
        console.log('Failed to get the storage location of u_Sampler5');
        return;
    }

    u_Sampler6 = gl.getUniformLocation(gl.program, 'u_Sampler6');
    if (!u_Sampler6) {
        console.log('Failed to get the storage location of u_Sampler6');
        return;
    }

    u_Sampler7 = gl.getUniformLocation(gl.program, 'u_Sampler7');
    if (!u_Sampler7) {
        console.log('Failed to get the storage location of u_Sampler7');
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

    // Get the storage location of the normal
    a_Normal = gl.getAttribLocation(gl.program, 'a_Normal');
    if (a_Normal < 0) {
        console.log('Failed to get the storage location of a_Normal');
        return;
    }

    // Get the storage location of the light position
    u_LightPosition = gl.getUniformLocation(gl.program, 'u_LightPosition');
    if (!u_LightPosition) {
        console.log('Failed to get the storage location of u_LightPosition');
        return;
    }

    // Get the storage location of the camera position
    u_cameraPosition = gl.getUniformLocation(gl.program, 'u_cameraPosition');
    if (!u_cameraPosition) {
        console.log('Failed to get the storage location of u_cameraPosition');
        return;
    }

    // Get the storage location of the normal matrix
    u_NormalMatrix = gl.getUniformLocation(gl.program, 'u_NormalMatrix');
    if (!u_NormalMatrix) {
        console.log('Failed to get the storage location of u_NormalMatrix');
        return;
    }
    
    // Get the storage location of the light color
    u_DiffuseLightColor = gl.getUniformLocation(gl.program, 'u_DiffuseLightColor');
    if (!u_DiffuseLightColor) {
        console.log('Failed to get the storage location of u_DiffuseLightColor');
        return;
    }

    // Get the storage location of the ambient light color
    u_AmbientLightColor = gl.getUniformLocation(gl.program, 'u_AmbientLightColor');
    if (!u_AmbientLightColor) {
        console.log('Failed to get the storage location of u_AmbientLightColor');
        return;
    }

    // Get the storage location of the lighting boolean
    u_lighting = gl.getUniformLocation(gl.program, 'u_lighting');
    if (!u_lighting) {
        console.log('Failed to get the storage location of u_lighting');
        return;
    }
    gl.uniform1i(u_lighting, true);

    // Get the storage location of the point light boolean
    u_PointLight = gl.getUniformLocation(gl.program, 'u_PointLight');
    if (!u_PointLight) {
        console.log('Failed to get the storage location of u_PointLight');
        return;
    }
    gl.uniform1i(u_PointLight, true);

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
    canvas.addEventListener("mousemove", click);
    canvas.addEventListener("mouseup", function(ev) {
        lastX = -1;
        lastY = -1;
    });23
    document.addEventListener("keydown", keydown);
    document.addEventListener("keyup", keyup);

    document.getElementById('normalOn').addEventListener('click', function() {g_normal = true;});
    document.getElementById('normalOff').addEventListener('click', function() {g_normal = false;});

    document.getElementById('lightX').addEventListener('input', function() {g_lightModifier[0] = parseFloat(document.getElementById('lightX').value)});
    document.getElementById('lightY').addEventListener('input', function() {g_lightModifier[1] = parseFloat(document.getElementById('lightY').value)});
    document.getElementById('lightZ').addEventListener('input', function() {g_lightModifier[2] = parseFloat(document.getElementById('lightZ').value)});

    document.getElementById('animatedOn').addEventListener('click', function() {g_animated = true;});
    document.getElementById('animatedOff').addEventListener('click', function() {g_animated = false;});

    document.getElementById('colorR').addEventListener('input', function() {g_DiffuseLightColor[0] = parseFloat(document.getElementById('colorR').value)});
    document.getElementById('colorG').addEventListener('input', function() {g_DiffuseLightColor[1] = parseFloat(document.getElementById('colorG').value)});
    document.getElementById('colorB').addEventListener('input', function() {g_DiffuseLightColor[2] = parseFloat(document.getElementById('colorB').value)});

    document.getElementById('ambientR').addEventListener('input', function() {g_AmbientLightColor[0] = parseFloat(document.getElementById('ambientR').value)});
    document.getElementById('ambientG').addEventListener('input', function() {g_AmbientLightColor[1] = parseFloat(document.getElementById('ambientG').value)});
    document.getElementById('ambientB').addEventListener('input', function() {g_AmbientLightColor[2] = parseFloat(document.getElementById('ambientB').value)});

    document.getElementById('lightingOn').addEventListener('click', function() {gl.uniform1i(u_lighting, true);});
    document.getElementById('lightingOff').addEventListener('click', function() {gl.uniform1i(u_lighting, false);});

    document.getElementById('pointLightOn').addEventListener('click', function() {gl.uniform1i(u_PointLight, true);});
    document.getElementById('pointLightOff').addEventListener('click', function() {gl.uniform1i(u_PointLight, false);});
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

let backgroundMusic;
let playerPain;
let enemyDeath;
let breakWall;
let healthPickup;
let shot;
let placeBlock;
function main() {
    setupWebGL();

    connectVariablesToGLSL();

    initTextures('../resources/stoneWalls.png', u_Sampler0, 0);
    initTextures('../resources/stoneWallDecorated.png', u_Sampler1, 1);
    initTextures('../resources/blueWall.png', u_Sampler2, 2);
    initTextures('../resources/blueWallDecorated.png', u_Sampler3, 3);
    initTextures('../resources/woodenWall.png', u_Sampler4, 4);
    initTextures('../resources/door.png', u_Sampler5, 5);
    initTextures('../resources/soldierStanding.png', u_Sampler6, 6); 
    initTextures('../resources/health.webp', u_Sampler7, 7);

    addActionsForHtmlUI();

    backgroundMusic = new Audio('../resources/getThem.mp3');
    backgroundMusic.loop = true;
    backgroundMusic.volume = 0.00;
    // backgroundMusic.play();

    playerPain = new Audio('../resources/playerPain.wav');
    playerPain.volume = 0.1;
    enemyDeath = new Audio('../resources/meinLeben.mp3');
    enemyDeath.volume = 0.1;
    breakWall = new Audio('../resources/breakWall.wav');
    breakWall.volume = 0.1;
    healthPickup = new Audio('../resources/Health.wav');
    healthPickup.volume = 0.1;
    shot = new Audio('../resources/shot.wav');
    shot.volume = 0.1;
    placeBlock = new Audio('../resources/placeBlock.wav');
    placeBlock.volume = 0.1;

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
    if(backgroundMusic.paused){
        // backgroundMusic.play();
    }
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
    handleInput(duration);
    average /= frameTracker.length;
    sendTextToHTML('FPS = ' + Math.floor(1000 / average), 'numdot');
    requestAnimationFrame(tick);
    sendTextToHTML('Health = ' + g_health, 'health');
    // If health goes before 0, refresh the page (an exceptionally lazy game over screen)
    if(g_health < 0){
        g_damageStartTime *= 1000.0;
        location.reload();
    }
    handleInput();

    if(g_animated){
        g_lightModifier[2] = Math.sin(g_seconds) * 5;
        document.getElementById('lightZ').value = g_lightModifier[2];
    }
}

function shiftClick(ev) {
    if(ev.shiftKey) {
        // Start poke animation
        g_pokeAnimation = true;
        g_pokeStartTime = performance.now() / 1000.0;
    }
}

var cam;
var g_takingDamage = false;
var g_healing = false
function renderAllShapes() {
    // Clear <canvas>
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // Define the projection matrix
    let projectionMatrix = new Matrix4();
    projectionMatrix.setPerspective(60, canvas.width / canvas.height, .1, 200);
    gl.uniformMatrix4fv(u_ProjectionMatrix, false, projectionMatrix.elements);

    // Define the view matrix
    let viewMatrix = new Matrix4();
    let viewArray = cam.fetchArray();
    viewMatrix.setLookAt(viewArray[0], viewArray[1], viewArray[2], viewArray[3], viewArray[4], viewArray[5], viewArray[6], viewArray[7], viewArray[8]);
    gl.uniformMatrix4fv(u_ViewMatrix, false, viewMatrix.elements);

    // Set the light colors
    gl.uniform3f(u_DiffuseLightColor, g_DiffuseLightColor[0], g_DiffuseLightColor[1], g_DiffuseLightColor[2]);
    gl.uniform3f(u_AmbientLightColor, g_AmbientLightColor[0], g_AmbientLightColor[1], g_AmbientLightColor[2]);

    let floor = new Cube();
    floor.matrix = new Matrix4();
    if(g_normal){
        floor.textureNum = -3;
    }else{
        floor.textureNum = -2;
    }
    floor.color = [0.7, 0.7, 0.7, 1];
    floor.matrix.translate(-32, 0, -32);
    floor.matrix.scale(64, 0, 64);
    floor.fastRender();

    let skyBox = new Cube();
    skyBox.matrix = new Matrix4();
    if(g_normal){
        skyBox.textureNum = -3;
    }else{
        skyBox.textureNum = -2;
    }
    skyBox.color = [0.52, 0.8, 0.92, 1];
    skyBox.matrix.translate(50, 50, 50);
    skyBox.matrix.scale(-100, -100, -100);
    skyBox.fastRender();

    let testSphere = new Sphere();
    testSphere.matrix = new Matrix4();
    if(g_normal){
        testSphere.textureNum = -3;
    }else{
        testSphere.textureNum = 0;
    }
    testSphere.color = [0.5, 0.5, 0.5, 1];
    testSphere.matrix.translate(-0.5, 0.5, -24);
    testSphere.matrix.scale(0.5, 0.5, 0.5);
    testSphere.fastRender();

    let light = new Cube();
    light.matrix = new Matrix4();
    light.textureNum = -2;
    light.color = [1, 1, 0, 1];
    console.log(g_initialLight[0] + g_lightModifier[0]);
    light.matrix.translate(g_initialLight[0] + g_lightModifier[0], g_initialLight[1] + g_lightModifier[1], g_initialLight[2] + g_lightModifier[2]);
    light.matrix.scale(-0.1, -0.1, -0.1);
    light.fastRender();
    gl.uniform3f(u_LightPosition, g_initialLight[0] + g_lightModifier[0], g_initialLight[1] + g_lightModifier[1], g_initialLight[2] + g_lightModifier[2]);

    if(g_healing){
        let heal = new Cube();
        heal.matrix = new Matrix4();
        if(g_normal){
            heal.textureNum = -3;
        }else{
            heal.textureNum = -2;
        }
        heal.color = [0, 1, 0, 1];
        heal.matrix.scale(1, 1, 1);
        heal.matrix.translate(cam.eye.elements[0]-0.5, 0.1, cam.eye.elements[2]-0.5);
        heal.fastRender();
        healingFor = performance.now() / 1000.0 - healFlashStartTime;
        if(healFlashTime < healingFor){
            g_healing = false;
            console.log('Healing done');
        }
    }

    if(g_damage){
        let heal = new Cube();
        heal.matrix = new Matrix4();
        if(g_normal){
            heal.textureNum = -3;
        }else{
            heal.textureNum = -2;
        }
        heal.color = [1, 0, 0, 1];
        heal.matrix.scale(1, 1, 1);
        heal.matrix.translate(cam.eye.elements[0]-0.5, 0.1, cam.eye.elements[2]-0.5);
        heal.fastRender();
        damageFor = performance.now() / 1000.0 - damageFlashStartTime;
        if(damageFlashTime < damageFor){
            g_damage = false;
        }
    }

    renderMap();
}

let healFlashTime = 0.2;
let healingFor = 0;
let healFlashStartTime = 0;
function heal(){
    g_health += 25;
    if(g_health > 200){
        g_health = 200;
    }
    console.log('Healed');
    g_healing = true;
    healFlashStartTime = performance.now() / 1000.0;
    healingFor = 0;
}

let g_damage = false
let damageFlashTime = 0.2;
let damageFor = 0;
let damageFlashStartTime = 0;
function damage(amount){
    g_health -= amount;
    console.log('damaged');
    g_damage = true;
    damageFlashStartTime = performance.now() / 1000.0;
    damageFor = 0;
}

// The map is 64x64, and defines both the texture and the height of every pillar
// The first digit is the height, the second digit is the texture
// So, 10 is a wall with a height of 1 with texture 1, 22 is a wall with a height of 2, with texture 2.
// This limits the height of the walls to 9, and the number textures to 9, but that should be fine for this project - webgl only supports 8 textures anyway
// @ts-ignore
let g_map = [
[00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00], //1
[00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00], //2
[00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00], //3
[00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00], //4
[00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00], //5
[00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00], //6
[00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00], //7
[00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00], //8
[00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 14, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 14, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00], //9
[00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 10, 10, 10, 11, 10, 11, 11, 10, 10, 11, 14, 00, 00, 00, 16, 00, 00, 00, 00, 00, 00, 00, 14, 14, 14, 14, 14, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00], //10
[00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 10, 00, 00, 00, 00, 00, 00, 00, 00, 00, 14, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 14, 00, 17, 17, 14, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00], //11
[00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 10, 00, 00, 00, 00, 00, 00, 00, 00, 00, 15, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 15, 00, 16, 17, 14, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00], //12
[00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 10, 00, 00, 00, 00, 00, 00, 00, 00, 00, 14, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 14, 00, 17, 17, 14, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00], //13
[00, 00, 00, 00, 00, 10, 10, 10, 10, 11, 11, 11, 10, 10, 10, 10, 00, 10, 00, 00, 00, 10, 10, 10, 10, 10, 11, 14, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 14, 14, 14, 14, 14, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00], //14
[00, 00, 00, 00, 00, 10, 17, 00, 00, 00, 00, 00, 00, 00, 00, 10, 00, 10, 00, 00, 00, 10, 00, 00, 00, 00, 00, 14, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 14, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00], //15
[00, 00, 00, 00, 00, 10, 00, 00, 00, 00, 00, 00, 00, 00, 16, 11, 10, 10, 00, 00, 00, 10, 11, 10, 00, 00, 00, 14, 14, 14, 14, 14, 14, 15, 14, 14, 14, 14, 14, 14, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00], //16
[00, 00, 00, 00, 00, 10, 00, 16, 00, 00, 00, 00, 00, 00, 00, 11, 00, 00, 00, 16, 00, 00, 00, 10, 00, 00, 00, 00, 00, 00, 00, 14, 00, 00, 00, 14, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00], //17 
[00, 00, 00, 00, 00, 11, 00, 00, 00, 00, 00, 00, 00, 00, 00, 15, 00, 00, 00, 00, 00, 00, 00, 10, 00, 00, 00, 00, 00, 00, 00, 14, 00, 16, 00, 14, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00], //18
[00, 00, 00, 00, 00, 10, 00, 00, 00, 00, 00, 00, 00, 00, 00, 10, 00, 00, 00, 00, 00, 16, 00, 10, 00, 00, 00, 00, 00, 00, 00, 14, 00, 00, 00, 14, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00], //19
[10, 11, 10, 11, 10, 10, 00, 16, 00, 00, 00, 00, 00, 00, 00, 10, 10, 11, 10, 10, 10, 11, 10, 10, 00, 00, 00, 00, 00, 00, 00, 14, 00, 00, 00, 14, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00], //20
[11, 00, 17, 00, 10, 10, 17, 00, 00, 00, 00, 00, 00, 00, 16, 10, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 14, 00, 00, 00, 14, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00], //21
[10, 00, 00, 00, 11, 10, 11, 10, 10, 10, 15, 10, 10, 10, 10, 10, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 14, 14, 14, 14, 00, 00, 00, 14, 14, 14, 14, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00], //22
[10, 00, 00, 00, 10, 00, 00, 00, 10, 00, 00, 00, 11, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 14, 16, 00, 00, 00, 00, 00, 00, 00, 17, 14, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00], //23
[10, 10, 15, 10, 10, 00, 00, 00, 10, 00, 00, 00, 10, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 14, 14, 14, 14, 00, 00, 00, 14, 14, 14, 14, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00], //24
[10, 00, 00, 00, 10, 10, 11, 10, 10, 00, 00, 00, 11, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 14, 00, 00, 00, 14, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00], //25
[10, 00, 00, 00, 11, 00, 00, 17, 10, 00, 00, 00, 10, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 14, 00, 00, 00, 14, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00], //26
[10, 00, 00, 00, 00, 00, 00, 16, 10, 00, 00, 00, 10, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 14, 00, 00, 00, 14, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00], //27
[10, 00, 00, 00, 10, 00, 00, 00, 11, 00, 16, 00, 10, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 14, 00, 00, 00, 14, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 12, 12, 13, 12, 13, 12, 13, 12, 12, 12, 00, 00, 00, 00], //28
[10, 00, 00, 00, 10, 10, 10, 11, 10, 10, 15, 10, 10, 10, 10, 10, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 10, 14, 14, 15, 14, 14, 10, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 12, 17, 00, 00, 00, 00, 00, 00, 00, 13, 00, 00, 00, 00], //29
[11, 00, 00, 00, 10, 10, 16, 00, 00, 00, 00, 00, 00, 00, 00, 10, 00, 00, 00, 00, 00, 00, 00, 00, 00, 10, 10, 11, 10, 10, 11, 00, 00, 00, 00, 00, 10, 10, 10, 10, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 12, 00, 00, 00, 00, 00, 00, 00, 00, 12, 00, 00, 00, 00], //30
[10, 00, 00, 00, 10, 10, 00, 00, 00, 00, 00, 00, 00, 00, 00, 10, 00, 00, 00, 00, 00, 00, 00, 00, 00, 10, 16, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 11, 12, 00, 00, 00, 00, 00, 00, 00, 00, 00, 12, 00, 00, 00, 00, 00, 16, 00, 00, 13, 00, 00, 00, 00], //31
[10, 00, 00, 00, 10, 11, 00, 00, 00, 00, 00, 00, 00, 00, 00, 11, 00, 00, 00, 00, 00, 00, 00, 00, 00, 10, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 10, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 00, 00, 00, 00, 00, 00, 00, 00, 12, 00, 00, 00, 00], //32
[10, 00, 00, 00, 00, 10, 00, 00, 00, 00, 00, 00, 00, 00, 00, 10, 00, 00, 00, 00, 00, 00, 00, 00, 00, 10, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 12, 00, 00, 00, 00, 00, 00, 00, 00, 00, 12, 00, 00, 00, 00, 00, 00, 00, 00, 13, 00, 00, 00, 00], //33
[10, 00, 00, 00, 00, 15, 00, 16, 00, 00, 00, 00, 00, 00, 00, 10, 00, 00, 00, 00, 00, 00, 00, 00, 00, 11, 16, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 15, 00, 00, 00, 00, 00, 00, 00, 00, 00, 15, 00, 00, 00, 00, 00, 00, 00, 00, 12, 00, 00, 00, 00], //34
[10, 00, 00, 00, 00, 10, 00, 00, 00, 00, 00, 00, 00, 00, 00, 10, 00, 00, 00, 00, 00, 00, 00, 00, 00, 11, 00, 00, 00, 00, 00, 00, 00, 16, 00, 00, 00, 00, 00, 00, 12, 00, 00, 00, 00, 00, 00, 00, 00, 00, 12, 00, 00, 00, 00, 00, 00, 00, 00, 13, 00, 00, 00, 00], //35
[11, 00, 00, 00, 10, 10, 00, 00, 00, 00, 00, 00, 00, 00, 00, 11, 00, 00, 00, 00, 00, 00, 00, 00, 00, 10, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 10, 12, 12, 12, 00, 00, 00, 00, 12, 12, 12, 12, 00, 00, 17, 00, 00, 00, 00, 00, 12, 00, 00, 00, 00], //36
[10, 00, 00, 00, 10, 10, 00, 00, 00, 00, 00, 00, 00, 00, 00, 10, 00, 00, 00, 00, 00, 00, 00, 00, 00, 11, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 10, 00, 00, 12, 12, 00, 00, 12, 12, 00, 00, 12, 00, 00, 00, 00, 00, 00, 00, 16, 13, 00, 00, 00, 00], //37
[10, 00, 00, 00, 10, 10, 00, 00, 00, 00, 00, 00, 00, 16, 00, 10, 00, 00, 00, 00, 00, 00, 00, 00, 00, 10, 10, 10, 11, 10, 00, 00, 00, 00, 00, 10, 11, 10, 10, 10, 00, 00, 00, 12, 00, 00, 12, 00, 00, 00, 12, 00, 00, 00, 00, 00, 00, 17, 00, 12, 00, 00, 00, 00], //38
[10, 00, 00, 00, 10, 10, 11, 10, 10, 11, 15, 10, 10, 11, 11, 10, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 10, 12, 12, 15, 12, 12, 12, 00, 00, 00, 00, 00, 00, 00, 12, 00, 00, 12, 00, 00, 00, 12, 00, 00, 00, 00, 00, 00, 00, 00, 13, 00, 00, 00, 00], //39
[10, 00, 00, 00, 11, 00, 00, 00, 10, 00, 00, 00, 10, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 12, 00, 00, 00, 12, 00, 00, 00, 00, 00, 00, 00, 00, 12, 00, 16, 12, 00, 00, 00, 12, 12, 13, 12, 13, 12, 13, 12, 13, 12, 00, 00, 00, 00], //40
[10, 00, 00, 00, 10, 10, 10, 11, 10, 00, 00, 00, 11, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 12, 00, 00, 00, 12, 00, 00, 00, 00, 00, 00, 00, 00, 12, 00, 00, 12, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00], //41
[10, 00, 00, 00, 10, 16, 00, 00, 10, 00, 00, 00, 10, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 12, 00, 00, 00, 12, 00, 00, 00, 00, 00, 00, 00, 00, 12, 00, 00, 12, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00], //42
[10, 00, 00, 00, 00, 00, 00, 00, 10, 00, 00, 00, 10, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 12, 00, 00, 00, 12, 00, 00, 00, 00, 00, 00, 00, 00, 12, 00, 00, 12, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00], //43
[10, 00, 00, 00, 11, 17, 00, 00, 10, 00, 00, 00, 11, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 12, 00, 00, 00, 12, 00, 00, 00, 00, 00, 00, 00, 00, 12, 00, 00, 12, 12, 13, 12, 13, 12, 13, 12, 13, 12, 12, 00, 00, 00, 00, 00, 00, 00], //44
[10, 00, 00, 00, 10, 10, 10, 10, 10, 00, 00, 00, 11, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 12, 00, 16, 00, 12, 00, 00, 00, 00, 00, 00, 00, 00, 12, 00, 00, 15, 00, 00, 00, 00, 00, 00, 00, 00, 00, 12, 00, 00, 00, 00, 00, 00, 00], //45
[11, 00, 00, 00, 11, 10, 10, 10, 10, 00, 16, 00, 11, 10, 11, 10, 10, 10, 10, 10, 10, 10, 10, 11, 10, 10, 10, 00, 00, 00, 12, 00, 00, 00, 12, 00, 00, 00, 00, 00, 00, 00, 00, 12, 00, 16, 12, 00, 00, 00, 00, 00, 00, 00, 00, 00, 13, 00, 00, 00, 00, 00, 00, 00], //46
[10, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 10, 00, 00, 00, 00, 00, 00, 16, 10, 00, 00, 00, 12, 00, 00, 00, 12, 00, 00, 00, 00, 00, 00, 00, 00, 12, 12, 12, 12, 00, 00, 00, 00, 00, 00, 00, 00, 00, 12, 00, 00, 00, 00, 00, 00, 00], //47
[10, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 15, 00, 00, 00, 00, 00, 16, 00, 18, 00, 00, 00, 12, 00, 00, 00, 12, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 12, 12, 13, 12, 13, 12, 13, 12, 13, 12, 12, 00, 00, 00, 00, 00, 00, 00], //48
[10, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 10, 00, 00, 00, 00, 00, 00, 16, 10, 00, 00, 00, 12, 00, 00, 00, 12, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00], //49
[10, 11, 11, 10, 11, 10, 10, 10, 10, 11, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 12, 12, 12, 12, 00, 00, 00, 12, 12, 12, 12, 12, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00], //50
[00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 12, 00, 00, 00, 12, 12, 15, 12, 12, 00, 00, 00, 12, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00], //51
[00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 12, 00, 00, 00, 15, 00, 00, 00, 15, 00, 00, 00, 13, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00], //52
[00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 13, 00, 00, 00, 12, 00, 00, 00, 12, 00, 00, 00, 12, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00], //53
[00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 12, 00, 00, 00, 12, 00, 00, 00, 12, 00, 00, 00, 12, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00], //54
[00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 12, 12, 12, 12, 12, 00, 00, 00, 12, 12, 12, 12, 12, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00], //55
[00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 12, 00, 00, 00, 12, 00, 00, 00, 12, 00, 00, 00, 12, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00], //56
[00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 12, 00, 00, 00, 15, 00, 00, 00, 15, 00, 00, 17, 12, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00], //57
[00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 12, 00, 00, 00, 12, 00, 00, 00, 12, 00, 00, 00, 12, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00], //58
[00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 12, 12, 12, 12, 12, 12, 12, 00, 00, 00, 12, 12, 12, 12, 12, 12, 12, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00], //59
[00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 12, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 12, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00], //60
[00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 13, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 16, 17, 13, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00], //61
[00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 12, 16, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 12, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00], //62
[00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00], //63
[00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00], //64
]

let g_textureNumber = 8;
let g_damageIntervals = 1;
let g_damageStartTime = performance.now() / 1000.0;
let g_damageTime = 0;
let g_range = 15;

function renderMap() {
    let verts = [];
    damageTime = performance.now() / 1000.0 - g_damageStartTime;
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
                if(g_normal) {
                    wall.textureNum = -3;
                }else if(textureNum === 8) {
                    wall.textureNum = -2;
                    wall.color = [1, 1, 0, 1];
                }else{
                    wall.textureNum = textureNum;
                }
                let x = g_map.length/2 - j - 1;
                let y = k;
                let z = g_map[0].length/2 - i - 1;
                wall.matrix.translate(x, k, z);
                wall.fastRender();
            }
            // If the "wall" is an enemy, try and damage the player
            if(textureNum === 6 && damageTime > g_damageIntervals){
                //g_damageStartTime = 100000
                cam.tryDamage(j, i);
            }
        }
    }
    if(damageTime > g_damageIntervals) {
        g_damageStartTime = performance.now() / 1000.0;
        damageTime = 0;
    }
}
    
// Help with multiple key presses from https://www.gavsblog.com/blog/detect-single-and-multiple-keypress-events-javascript
let keysPressed = {};
function keydown(ev) {
    keysPressed[ev.key] = true;
    if(ev.key === ' ') {
        cam.removeWall();
    }
    let j = 0;
    for(let i = 49; i < 49 + g_textureNumber; i++) {
        if(ev.key === String.fromCharCode(i)) {
            console.log('Placing wall with texture ' + j);
            cam.placeWall(j);
        }
        j++;
    }
}

function keyup(ev) {
    keysPressed[ev.key] = false;
}

function handleInput(duration){
    if(!duration){
        return
    }

    gl.uniform3f(u_cameraPosition, cam.eye.elements[0], cam.eye.elements[1], cam.eye.elements[2]);

    let g_moveStep = 0.005 * duration;
    if(keysPressed['w']) {
        cam.moveFwdOrBwd(g_moveStep);
    }
    if(keysPressed['s']) {
        cam.moveFwdOrBwd(-g_moveStep);
    }
    if(keysPressed['a']) {
        cam.moveLOrR(g_moveStep);
    }
    if(keysPressed['d']) {
        cam.moveLOrR(-g_moveStep);
    }
    if(keysPressed['q']) {
        cam.rotate(-g_moveStep * 100, 0);
    }
    if(keysPressed['e']) {
        cam.rotate(g_moveStep * 100, 0);
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