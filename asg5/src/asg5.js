
import * as THREE from 'three';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import { MTLLoader } from 'three/examples/jsm/loaders/MTLLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

let scene = new THREE.Scene();
let camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
let camera2 = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const objLoader = new OBJLoader();
const mtlLoader = new MTLLoader();
let renderer = new THREE.WebGLRenderer();
let controls;
let speed = 0.05;
let whichCam = 0;
let backgroundColor = 0x808080;

class MinMaxGUIHelper {
    constructor(obj, minProp, maxProp, minDif) {
      this.obj = obj;
      this.minProp = minProp;
      this.maxProp = maxProp;
      this.minDif = minDif;
    }
    get min() {
      return this.obj[this.minProp];
    }
    set min(v) {
      this.obj[this.minProp] = v;
      this.obj[this.maxProp] = Math.max(this.obj[this.maxProp], v + this.minDif);
    }
    get max() {
      return this.obj[this.maxProp];
    }
    set max(v) {
      this.obj[this.maxProp] = v;
      this.min = this.min;  // this will call the min setter
    }
  }

function main() {
    document.getElementById('speed').addEventListener('input', (e) => {
        speed = e.target.value;
    });
    document.getElementById('camSwap').onclick = (() => {
        console.log("clicked");
        if(whichCam === 0){
            whichCam = 1;
        }
        else{
            whichCam = 0;
        }
    });
    const canvas = document.getElementById('c');
    renderer = new THREE.WebGLRenderer({canvas});

    // Set up rotating camera
    const fov = 45;
    const aspect = 2; 
    const near = 0.1;
    const far = 100;
    camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
    camera.position.z = 20;
    camera.position.y = 10;

    // Set up POV camera
    const fov2 = 45;
    const aspect2 = 2;
    const near2 = 0.1;
    const far2 = 100;
    camera2 = new THREE.PerspectiveCamera(fov2, aspect2, near2, far2);
    // Location of the camera will be set in the render function, as it will follow the car

    controls = new OrbitControls(camera, canvas);
    controls.target.set(0, 1, 0);
    controls.update();

    scene = new THREE.Scene();
    scene.fog = new THREE.Fog(backgroundColor, 5, 50);

    const boxWidth = 1;
    const boxHeight = 1;
    const boxDepth = 1;
    const geometry = new THREE.BoxGeometry(boxWidth, boxHeight, boxDepth);

    const loader = new THREE.TextureLoader();

    // Abient light
    const ambientColor = 0xFFFFFF;
    const ambientIntensity = 0.2;
    const ambientLight = new THREE.AmbientLight(ambientColor, ambientIntensity);
    scene.add(ambientLight);

    // Directional light
    const directionalColor = 0xFFFFFF;
    const directionalIntensity = 0.8;
    const directionalLight = new THREE.DirectionalLight(directionalColor, directionalIntensity);
    directionalLight.position.set(-1, 2, 4);
    scene.add(directionalLight);

    // Skybox
    scene.background = new THREE.Color(backgroundColor);

    const planeSize = 100;
 
    // Floor plane
    const grassTexture = loader.load('resources/grass.jpg');
    grassTexture.wrapS = THREE.RepeatWrapping;
    grassTexture.wrapT = THREE.RepeatWrapping;
    grassTexture.magFilter = THREE.NearestFilter;
    grassTexture.colorSpace = THREE.SRGBColorSpace;
    const repeats = planeSize / 2;
    grassTexture.repeat.set(repeats, repeats);
    
    const planeGeo = new THREE.PlaneGeometry(planeSize, planeSize);
    const planeMat = new THREE.MeshPhongMaterial({
    map: grassTexture,
    side: THREE.DoubleSide,
    });
    const mesh = new THREE.Mesh(planeGeo, planeMat);
    mesh.rotation.x = Math.PI * -.5;
    scene.add(mesh);

    // Road cube
    const roadWidth = 10;
    const roadTexture = loader.load('resources/road.jpg');
    roadTexture.wrapS = THREE.RepeatWrapping;
    const roadRepeats = planeSize / 10; 
    roadTexture.repeat.set(roadRepeats, 1);

    const roadCube = texturedCube(roadTexture, [planeSize, 0.1, roadWidth], [0, 0.05, 0]);

    // Side walk
    const sideWalkWidth = roadWidth / 5;
    const leftSideWalk = coloredCube(0x808080, [planeSize, 0.2, sideWalkWidth], [0, 0.1, roadWidth / 2 + sideWalkWidth / 2]);
    const rightSideWalk = coloredCube(0x808080, [planeSize, 0.1, sideWalkWidth], [0, 0.1, -roadWidth / 2 - sideWalkWidth / 2]);

    // Car
    const car = new Car();
    car.create();
    car.setPosition(0, 2.3, roadWidth / 3.5);
    car.setScale(3, 3, 3);

    // Streetlamps every 10 units on both sides of the road
    for(let i = -planeSize/2; i < planeSize/2; i += 10){
        const rightLamp = new Streelamp();
        rightLamp.create();
        rightLamp.setPosition(i, 0, roadWidth / 2 + sideWalkWidth / 2);
        rightLamp.setScale(1, 1, 1);

        const leftLamp = new Streelamp();
        leftLamp.create();
        leftLamp.setPosition(i, 0, -roadWidth / 2 - sideWalkWidth / 2);
        leftLamp.setScale(1, 1, 1);
    }
  
    let lastStep = undefined;
    let position = 0;
    function render(time) {
        if (lastStep === undefined) {
            lastStep = time;
        }
        const deltaTime = time - lastStep;
        lastStep = time;

        position += speed * deltaTime;
        if (position > planeSize/2) {
            position = -planeSize/2
        };

        car.setPosition(position, 2.3, roadWidth / 3.5);

        if(whichCam === 0){
            renderer.render(scene, camera);
        }else{
            console.log(position);
            camera2.position.set(position + 2, 2.5, (roadWidth / 3.5));
            camera2.lookAt(position + 3, 2.5, roadWidth / 3.5);
            renderer.render(scene, camera2);
        }

        requestAnimationFrame(render);
    }
    requestAnimationFrame(render);
}

class Car{
    constructor(){
        this.car = new THREE.Group();
        this.car.position.set(0, 0, 0);
        this.car.rotation.set(0, 0, 0);
        this.car.scale.set(1, 1, 1);
        this.color = new THREE.Color(0x004225)
    }

    setPosition(x, y, z){
        this.car.position.set(x, y, z);
    }

    setScale(x, y, z){
        this.car.scale.set(x, y, z);
    }

    create(){
        // Car body
        const bodyMiddle = coloredCube(this.color, [1, 0.75, 1], [0, -0.125, 0]);
        const bodyFront = coloredCube(this.color, [0.5, 0.5, 1], [0.75, -0.25, 0]);
        const bodyBack = coloredCube(this.color, [0.5, 0.5, 1], [-0.75, -0.25, 0]);
        this.car.add(bodyMiddle);
        this.car.add(bodyFront);
        this.car.add(bodyBack);

        // Car wheels
        const wheelRadius = 0.25;
        const wheelLength = 0.1;
        const wheelFrontLeft = coloredCylinder(0x000000, wheelRadius, wheelLength, [0.75, -0.5, 0.5]);
        wheelFrontLeft.rotation.set(Math.PI / 2, 0, 0);
        const wheelFrontRight = coloredCylinder(0x000000, wheelRadius, wheelLength, [0.75, -0.5, -0.5]);
        wheelFrontRight.rotation.set(Math.PI / 2, 0, 0);
        const wheelBackLeft = coloredCylinder(0x000000, wheelRadius, wheelLength, [-0.75, -0.5, 0.5]);
        wheelBackLeft.rotation.set(Math.PI / 2, 0, 0);
        const wheelBackRight = coloredCylinder(0x000000, wheelRadius, wheelLength, [-0.75, -0.5, -0.5]);
        wheelBackRight.rotation.set(Math.PI / 2, 0, 0);
        this.car.add(wheelFrontLeft);
        this.car.add(wheelFrontRight);
        this.car.add(wheelBackLeft);
        this.car.add(wheelBackRight);

        // Headlights
        const headlightLeft = coloredSphere(0xFFFFFF, 0.05, [1.0, -0.25, 0.3]);
        const headlightRight = coloredSphere(0xFFFFFF, 0.05, [1.0, -0.25, -0.3]);
        this.car.add(headlightLeft);
        this.car.add(headlightRight);

        // Add spotlights to the headlights
        const spotLightColor = 0xFFFFFF;
        const spotLightIntensity = 200;

        const leftSpotlight = new THREE.SpotLight(spotLightColor, spotLightIntensity);
        leftSpotlight.position.set(1.0, -0.25, 0.3);
        leftSpotlight.penumbra = 0.99;
        leftSpotlight.angle = Math.PI / 5;
        const leftTarget = new THREE.Object3D();
        leftTarget.position.set(1.5, -0.25, 0.3);
        this.car.add(leftTarget);
        leftSpotlight.target = leftTarget;

        const rightSpotlight = new THREE.SpotLight(spotLightColor, spotLightIntensity);
        rightSpotlight.position.set(1.0, -0.25, -0.3);
        rightSpotlight.penumbra = 0.99;
        rightSpotlight.angle = Math.PI / 5;
        const rightTarget = new THREE.Object3D();
        rightTarget.position.set(1.5, -0.25, -0.3);
        this.car.add(rightTarget);
        rightSpotlight.target = rightTarget;

        this.car.add(leftSpotlight);
        this.car.add(rightSpotlight);
        
        // Make the windshield reflect a scene with the car color background with the soldier model's face in it
        const width = 256;
        const height = 1024;
        const renderTarget = new THREE.WebGLRenderTarget(width, height);
        const renderTargetCamera = new THREE.PerspectiveCamera(30, height / width, 0.1, 1000);
        renderTargetCamera.position.set(0, 0, 3);
        renderTargetCamera.lookAt(0, 0, 0);
        const renderTargetScene = new THREE.Scene();
        renderTargetScene.background = new THREE.Color(0x004225);
        mtlLoader.load('../resources/Soldier/FREEScene.mtl', function (materials) {
            materials.preload();
            objLoader.setMaterials(materials);
            objLoader.load('../resources/Soldier/FREEScene.obj', function (object) {
                object.position.set(-1.5,-6.5,0);
                object.rotation.set(0, Math.PI/10, 0);
                object.scale.set(4,4,4);
                renderTargetScene.add(object);
                renderer.setRenderTarget(renderTarget);
                renderer.render(renderTargetScene, renderTargetCamera);
                renderer.setRenderTarget(null);
            });
        });

        const ambientLight = new THREE.AmbientLight(0xFFFFFF, 0.8);
        renderTargetScene.add(ambientLight);

        const material = new THREE.MeshBasicMaterial({map: renderTarget.texture});
        const geometry = new THREE.BoxGeometry(0.01, 0.25, 1);
        //const geometry = new THREE.BoxGeometry(0.01, 2, 8);
        const windshield = new THREE.Mesh(geometry, material);
        windshield.position.set(0.5, 0.125, 0);
        scene.add(windshield);
        this.car.add(windshield);

        scene.add(this.car);
    }

    renderWindshield(){
        
    }
}

class Streelamp{
    constructor(){
        this.streelamp = new THREE.Group();
        this.lightColor = 0xFFFFFF;
        this.lightIntensity = 200;
        this.lightPenumbra = 0.99;
        this.lightAngle = Math.PI / 5;
        this.streelamp.position.set(0, 0, 0);
        this.streelamp.rotation.set(0, 0, 0);
        this.streelamp.scale.set(1, 1, 1);
    }

    setPosition(x, y, z){
        this.streelamp.position.set(x, y, z);
    }

    setScale(x, y, z){
        this.streelamp.scale.set(x, y, z);
    }

    setRotation(x, y, z){
        this.streelamp.rotation.set(x, y, z);
    }

    create(){
        // Lamp post
        const post = coloredCylinder(0x808080, 0.1, 5, [0, 2.5, 0]);
        this.streelamp.add(post);

        // Lamp
        const lamp = coloredSphere(0xFFFFFF, 0.5, [0, 5.5, 0]);
        this.streelamp.add(lamp);

        // Covering
        // Help with creating a semi-sphere: https://stackoverflow.com/questions/70602374/how-to-create-a-semicircle-sphere-in-three-js
        const phiStart = 0;
        const phiEnd = Math.PI * 2;
        const thetaStart = 0;
        const thetaEnd = Math.PI / 2;

        const coveringGeometry = new THREE.SphereGeometry(0.6, 32, 32, phiStart, phiEnd, thetaStart, thetaEnd);
        const coveringMaterial = new THREE.MeshPhongMaterial({color: 0x808080});  
        const covering = new THREE.Mesh(coveringGeometry, coveringMaterial);
        covering.position.set(0, 5.5, 0);
        this.streelamp.add(covering);

        // Light
        const light = new THREE.SpotLight(this.lightColor, this.lightIntensity);
        light.position.set(0, 5.5, 0);
        light.penumbra = this.lightPenumbra;
        light.angle = this.lightAngle;
        const target = new THREE.Object3D();
        target.position.set(0, 0, 0);
        this.streelamp.add(target);
        light.target = target;
        this.streelamp.add(light);

        scene.add(this.streelamp);
    }

}

function texturedCube(texture, size, location){
    const geometry = new THREE.BoxGeometry(size[0], size[1], size[2]);
    const material = new THREE.MeshPhongMaterial({map: texture});
    const cube = new THREE.Mesh(geometry, material);
    cube.position.set(location[0], location[1], location[2]);
    scene.add(cube);
    return cube;
}

function coloredCube(color, size, location){
    const geometry = new THREE.BoxGeometry(size[0], size[1], size[2]);
    const material = new THREE.MeshPhongMaterial({color});
    const cube = new THREE.Mesh(geometry, material);
    cube.position.set(location[0], location[1], location[2]);
    scene.add(cube);
    return cube;
}

function coloredCylinder(color, radius, length, location){
    const geometry = new THREE.CylinderGeometry(radius, radius, length, 32);
    const material = new THREE.MeshPhongMaterial({color});
    const wheel = new THREE.Mesh(geometry, material);
    wheel.position.set(location[0], location[1], location[2]);
    scene.add(wheel);
    return wheel;
}

function coloredSphere(color, radius, location){
    const geometry = new THREE.SphereGeometry(radius, 32, 32);
    const material = new THREE.MeshPhongMaterial({color});
    const sphere = new THREE.Mesh(geometry, material);
    sphere.position.set(location[0], location[1], location[2]);
    scene.add(sphere);
    return sphere;
}

function updateCamera() {
    camera.updateProjectionMatrix();
}

main();