
import * as THREE from 'three';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import { MTLLoader } from 'three/examples/jsm/loaders/MTLLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

let scene = new THREE.Scene();
let camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const objLoader = new OBJLoader();
const mtlLoader = new MTLLoader();
let controls;

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
    const canvas = document.querySelector('#c');
    const renderer = new THREE.WebGLRenderer({canvas});

    const fov = 45;
    const aspect = 2; 
    const near = 0.1;
    const far = 100;
    camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
    camera.position.z = 20;
    camera.position.y = 10;

    controls = new OrbitControls(camera, canvas);
    controls.target.set(0, 1, 0);
    controls.update();

    scene = new THREE.Scene();

    const boxWidth = 1;
    const boxHeight = 1;
    const boxDepth = 1;
    const geometry = new THREE.BoxGeometry(boxWidth, boxHeight, boxDepth);

    const loader = new THREE.TextureLoader();

    const ambientColor = 0xFFFFFF;
    const ambientIntensity = 0.2;
    const ambientLight = new THREE.AmbientLight(ambientColor, ambientIntensity);
    scene.add(ambientLight);

    const directionalColor = 0xFFFFFF;
    const directionalIntensity = 0.8;
    const directionalLight = new THREE.DirectionalLight(directionalColor, directionalIntensity);
    directionalLight.position.set(-1, 2, 4);
    scene.add(directionalLight);

    const spotLightColor = 0xFFFFFF;
    const spotLightIntensity = 200;
    const spotLight = new THREE.SpotLight(spotLightColor, spotLightIntensity);
    spotLight.position.set(0, 5, 5);
    spotLight.penumbra = 0.99;
    spotLight.angle = Math.PI / 10;

    scene.add(spotLight);

    mtlLoader.load('../resources/Soldier/FREEScene.mtl', function (materials) {
        materials.preload();
        objLoader.setMaterials(materials);
        objLoader.load('../resources/Soldier/FREEScene.obj', function (object) {
            scene.add(object);
        });
    });

    const cubeLoader = new THREE.CubeTextureLoader();
    const skyTexture = cubeLoader.load([
        './resources/Skybox/front.jpg',
        './resources/Skybox/back.jpg',
        './resources/Skybox/sky.jpg',
        './resources/Skybox/ground.jpg',
        './resources/Skybox/right.jpg',
        './resources/Skybox/left.jpg',
    ]);
    scene.background = skyTexture;

    const planeSize = 40;
 
    const texture = loader.load('resources/checker.png');
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.magFilter = THREE.NearestFilter;
    texture.colorSpace = THREE.SRGBColorSpace;
    const repeats = planeSize / 2;
    texture.repeat.set(repeats, repeats);
    
    const planeGeo = new THREE.PlaneGeometry(planeSize, planeSize);
    const planeMat = new THREE.MeshPhongMaterial({
    map: texture,
    side: THREE.DoubleSide,
    });
    const mesh = new THREE.Mesh(planeGeo, planeMat);
    mesh.rotation.x = Math.PI * -.5;
    scene.add(mesh);

    function render(time) {
        time *= 0.001;  // convert time to seconds

        // cubes.forEach((cube, ndx) => {
        //     const speed = 1 + ndx * .1;
        //     const rot = time * speed;
        //     cube.rotation.x = rot;
        //     cube.rotation.y = rot;
        // });

        renderer.render(scene, camera);

        requestAnimationFrame(render);
    }
    requestAnimationFrame(render);
}

function makeInstance(geometry, color, x) {
    const material = new THREE.MeshPhongMaterial({color});

    const cube = new THREE.Mesh(geometry, material);
    scene.add(cube);

    cube.position.x = x;

    return cube;
}

function makeTexturedCube(geometry, texture, x) {
    const material = new THREE.MeshBasicMaterial({map: texture});

    const cube = new THREE.Mesh(geometry, material);
    scene.add(cube);

    cube.position.x = x;

    return cube;
}

function updateCamera() {
    camera.updateProjectionMatrix();
}

main();