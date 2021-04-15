import "./main.css";
import "./hue.js";
import "./perspective.js";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
// import * as dat from "dat.gui";

const params = {
  enableWind: true,
  showBall: false,
  togglePins: togglePins,
};

const DAMPING = 0.03;
const DRAG = 1 - DAMPING;
const MASS = 0.1;
const restDistance = 25;

const xSegs = 10;
const ySegs = 10;

const clothFunction = plane(restDistance * xSegs, restDistance * ySegs);

const cloth = new Cloth(xSegs, ySegs);

const GRAVITY = 981 * 1.4;
const gravity = new THREE.Vector3(0, -GRAVITY, 0).multiplyScalar(MASS);

const TIMESTEP = 18 / 1000;
const TIMESTEP_SQ = TIMESTEP * TIMESTEP;

let pins = [];

const windForce = new THREE.Vector3(0, 0, 0);

const ballPosition = new THREE.Vector3(0, -45, 0);
const ballSize = 60; //40

const tmpForce = new THREE.Vector3();

function plane(width, height) {
  return function (u, v, target) {
    const x = (u - 0.5) * width;
    const y = (v + 0.5) * height;
    const z = 0;

    target.set(x, y, z);
  };
}

function Particle(x, y, z, mass) {
  this.position = new THREE.Vector3();
  this.previous = new THREE.Vector3();
  this.original = new THREE.Vector3();
  this.a = new THREE.Vector3(0, 0, 0); // acceleration
  this.mass = mass;
  this.invMass = 1 / mass;
  this.tmp = new THREE.Vector3();
  this.tmp2 = new THREE.Vector3();

  // init

  clothFunction(x, y, this.position); // position
  clothFunction(x, y, this.previous); // previous
  clothFunction(x, y, this.original);
}

// Force -> Acceleration

Particle.prototype.addForce = function (force) {
  this.a.add(this.tmp2.copy(force).multiplyScalar(this.invMass));
};

// Performs Verlet integration

Particle.prototype.integrate = function (timesq) {
  const newPos = this.tmp.subVectors(this.position, this.previous);
  newPos.multiplyScalar(DRAG).add(this.position);
  newPos.add(this.a.multiplyScalar(timesq));

  this.tmp = this.previous;
  this.previous = this.position;
  this.position = newPos;

  this.a.set(0, 0, 0);
};

const diff = new THREE.Vector3();

function satisfyConstraints(p1, p2, distance) {
  diff.subVectors(p2.position, p1.position);
  const currentDist = diff.length();
  if (currentDist === 0) return; // prevents division by 0
  const correction = diff.multiplyScalar(1 - distance / currentDist);
  const correctionHalf = correction.multiplyScalar(0.5);
  p1.position.add(correctionHalf);
  p2.position.sub(correctionHalf);
}

function Cloth(w, h) {
  w = w || 10;
  h = h || 10;
  this.w = w;
  this.h = h;

  const particles = [];
  const constraints = [];

  // Create particles
  for (let v = 0; v <= h; v++) {
    for (let u = 0; u <= w; u++) {
      particles.push(new Particle(u / w, v / h, 0, MASS));
    }
  }

  // Structural

  for (let v = 0; v < h; v++) {
    for (let u = 0; u < w; u++) {
      constraints.push([
        particles[index(u, v)],
        particles[index(u, v + 1)],
        restDistance,
      ]);

      constraints.push([
        particles[index(u, v)],
        particles[index(u + 1, v)],
        restDistance,
      ]);
    }
  }

  for (let u = w, v = 0; v < h; v++) {
    constraints.push([
      particles[index(u, v)],
      particles[index(u, v + 1)],
      restDistance,
    ]);
  }

  for (let v = h, u = 0; u < w; u++) {
    constraints.push([
      particles[index(u, v)],
      particles[index(u + 1, v)],
      restDistance,
    ]);
  }

  this.particles = particles;
  this.constraints = constraints;

  function index(u, v) {
    return u + v * (w + 1);
  }

  this.index = index;
}

function simulate(now) {
  const windStrength = Math.cos(now / 7000) * 20 + 40;

  windForce.set(
    Math.sin(now / 2000),
    Math.cos(now / 3000),
    Math.sin(now / 1000)
  );
  windForce.normalize();
  windForce.multiplyScalar(windStrength);

  // Aerodynamics forces

  const particles = cloth.particles;

  if (params.enableWind) {
    let indx;
    const normal = new THREE.Vector3();
    const indices = clothGeometry.index;
    const normals = clothGeometry.attributes.normal;

    for (let i = 0, il = indices.count; i < il; i += 3) {
      for (let j = 0; j < 3; j++) {
        indx = indices.getX(i + j);
        normal.fromBufferAttribute(normals, indx);
        tmpForce.copy(normal).normalize().multiplyScalar(normal.dot(windForce));
        particles[indx].addForce(tmpForce);
      }
    }
  }

  for (let i = 0, il = particles.length; i < il; i++) {
    const particle = particles[i];
    particle.addForce(gravity);

    particle.integrate(TIMESTEP_SQ);
  }

  // Start Constraints

  const constraints = cloth.constraints;
  const il = constraints.length;

  for (let i = 0; i < il; i++) {
    const constraint = constraints[i];
    satisfyConstraints(constraint[0], constraint[1], constraint[2]);
  }

  // Ball Constraints

  ballPosition.z = -Math.sin(now / 600) * 90; //+ 40;
  ballPosition.x = Math.cos(now / 400) * 70;

  if (params.showBall) {
    sphere.visible = true;

    for (let i = 0, il = particles.length; i < il; i++) {
      const particle = particles[i];
      const pos = particle.position;
      diff.subVectors(pos, ballPosition);
      if (diff.length() < ballSize) {
        // collided
        diff.normalize().multiplyScalar(ballSize);
        pos.copy(ballPosition).add(diff);
      }
    }
  } else {
    sphere.visible = false;
  }

  // Floor Constraints

  for (let i = 0, il = particles.length; i < il; i++) {
    const particle = particles[i];
    const pos = particle.position;
    if (pos.y < -250) {
      pos.y = -250;
    }
  }

  // Pin Constraints

  for (let i = 0, il = pins.length; i < il; i++) {
    const xy = pins[i];
    const p = particles[xy];
    p.position.copy(p.original);
    p.previous.copy(p.original);
  }
}

/* testing cloth simulation */

const pinsFormation = [];
pins = [6];

pinsFormation.push(pins);

pins = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
pinsFormation.push(pins);

pins = [0];
pinsFormation.push(pins);

pins = []; // cut the rope ;)
pinsFormation.push(pins);

pins = [0, cloth.w]; // classic 2 pins
pinsFormation.push(pins);

pins = pinsFormation[1];

function togglePins() {
  pins = pinsFormation[~~(Math.random() * pinsFormation.length)];
}

// let container, stats;
let container;
let camera, scene, renderer;

let clothGeometry;
let sphere;
let object;

init();
animate(0);

function init() {
  console.log("running init");
  container = document.getElementById("container");
  // document.body.appendChild(container);

  // scene

  scene = new THREE.Scene();
  // scene.background = new THREE.Color("hsl(0, 100%, 50%)");
  // scene.background = new THREE.Color(`hsl(${colorAccentHue}, 100%, 50%)`);

  // camera

  camera = new THREE.PerspectiveCamera(
    10,
    window.innerWidth / window.innerHeight,
    1,
    10000
  );
  camera.position.set(1000, 50, 1500);

  // lights

  var light = new THREE.AmbientLight("hsl(180, 100%, 50%)");
  scene.add(light);

  // cloth material

  const loader = new THREE.TextureLoader();
  const clothTexture = loader.load("/images/apluse-03.png");
  clothTexture.anisotropy = 16;

  const clothMaterial = new THREE.MeshToonMaterial({
    map: clothTexture,
    side: THREE.DoubleSide,
    alphaTest: 0.5,
  });

  // cloth geometry

  clothGeometry = new THREE.ParametricBufferGeometry(
    clothFunction,
    cloth.w,
    cloth.h
  );

  // cloth mesh

  object = new THREE.Mesh(clothGeometry, clothMaterial);
  object.position.set(0, 0, 0);
  object.castShadow = true;
  scene.add(object);

  object.customDepthMaterial = new THREE.MeshDepthMaterial({
    depthPacking: THREE.RGBADepthPacking,
    map: clothTexture,
    alphaTest: 0.5,
  });

  // sphere

  const ballGeo = new THREE.SphereGeometry(ballSize, 32, 16);
  const ballMaterial = new THREE.MeshLambertMaterial();

  sphere = new THREE.Mesh(ballGeo, ballMaterial);
  sphere.castShadow = true;
  sphere.receiveShadow = true;
  sphere.visible = false;
  scene.add(sphere);

  // renderer

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);

  container.appendChild(renderer.domElement);

  renderer.outputEncoding = THREE.sRGBEncoding;

  renderer.shadowMap.enabled = true;

  // controls

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.maxPolarAngle = Math.PI * 0.5;
  controls.minDistance = 1000;
  controls.maxDistance = 5000;

  // disable movement controls
  controls.enabled = false;

  //

  window.addEventListener("resize", onWindowResize);

  //

  // performance monitor

  // stats = new Stats();
  // container.appendChild( stats.dom );

  // gui

  // const gui = new GUI();
  // gui.add( params, 'enableWind' ).name( 'Enable wind' );
  // gui.add( params, 'showBall' ).name( 'Show ball' );
  // gui.add( params, 'togglePins' ).name( 'Toggle pins' );

  //

  if (typeof TESTING !== "undefined") {
    for (let i = 0; i < 50; i++) {
      simulate(500 - 10 * i);
    }
  }
}

//

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(window.innerWidth, window.innerHeight);
}

//

function animate(now) {
  requestAnimationFrame(animate);
  simulate(now);
  render();
  //   stats.update();
}

function render() {
  const p = cloth.particles;

  for (let i = 0, il = p.length; i < il; i++) {
    const v = p[i].position;

    clothGeometry.attributes.position.setXYZ(i, v.x, v.y, v.z);
  }

  clothGeometry.attributes.position.needsUpdate = true;

  clothGeometry.computeVertexNormals();

  sphere.position.copy(ballPosition);

  // get and define variables for colorAccent and colorAccentHue

  var style = getComputedStyle(document.body);
  console.log(style.getPropertyValue("--color-accent-hue")); // get accent hue color
  console.log(style.getPropertyValue("--color-accent-hue-inverse")); // get accent hue inverse color
  const colorAccentHue = style.getPropertyValue("--color-accent-hue");
  const colorAccentHueInverse = style.getPropertyValue(
    "--color-accent-hue-inverse"
  );

  scene.background = new THREE.Color(`hsl(${colorAccentHue}, 100%, 50%)`);


  // this isn't working
  // var light = new THREE.AmbientLight(
  //   `hsl(${colorAccentHueInverse}, 100%, 50%)`
  // );
  // scene.add(light);

  renderer.render(scene, camera);
}
