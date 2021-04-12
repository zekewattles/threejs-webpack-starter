import"./main.css";import*as THREE from"three";import{OrbitControls}from"three/examples/jsm/controls/OrbitControls.js";import*as dat from"dat.gui";var style=getComputedStyle(document.body);console.log(style.getPropertyValue("--color-accent-hue")),console.log(style.getPropertyValue("--color-accent-hue-inverse"));const params={enableWind:!0,showBall:!1,togglePins},DAMPING=.03,DRAG=.97,MASS=.1,restDistance=25,xSegs=10,ySegs=10,clothFunction=plane(250,250),cloth=new Cloth(10,10),GRAVITY=981*1.4,gravity=new THREE.Vector3(0,-GRAVITY,0).multiplyScalar(.1),TIMESTEP=.018,TIMESTEP_SQ=.018*.018;let pins=[];const windForce=new THREE.Vector3(0,0,0),ballPosition=new THREE.Vector3(0,-45,0),ballSize=60,tmpForce=new THREE.Vector3;function plane(e,t){return function(n,o,i){const s=(n-.5)*e,r=(o+.5)*t;i.set(s,r,0)}}function Particle(e,t,n,o){this.position=new THREE.Vector3,this.previous=new THREE.Vector3,this.original=new THREE.Vector3,this.a=new THREE.Vector3(0,0,0),this.mass=o,this.invMass=1/o,this.tmp=new THREE.Vector3,this.tmp2=new THREE.Vector3,clothFunction(e,t,this.position),clothFunction(e,t,this.previous),clothFunction(e,t,this.original)}Particle.prototype.addForce=function(e){this.a.add(this.tmp2.copy(e).multiplyScalar(this.invMass))},Particle.prototype.integrate=function(e){const t=this.tmp.subVectors(this.position,this.previous);t.multiplyScalar(.97).add(this.position),t.add(this.a.multiplyScalar(e)),this.tmp=this.previous,this.previous=this.position,this.position=t,this.a.set(0,0,0)};const diff=new THREE.Vector3;function satisfyConstraints(e,t,n){diff.subVectors(t.position,e.position);const o=diff.length();if(0===o)return;const i=diff.multiplyScalar(1-n/o).multiplyScalar(.5);e.position.add(i),t.position.sub(i)}function Cloth(e,t){e=e||10,t=t||10,this.w=e,this.h=t;const n=[],o=[];for(let o=0;o<=t;o++)for(let i=0;i<=e;i++)n.push(new Particle(i/e,o/t,0,.1));for(let s=0;s<t;s++)for(let t=0;t<e;t++)o.push([n[i(t,s)],n[i(t,s+1)],25]),o.push([n[i(t,s)],n[i(t+1,s)],25]);for(let s=e,r=0;r<t;r++)o.push([n[i(s,r)],n[i(s,r+1)],25]);for(let s=t,r=0;r<e;r++)o.push([n[i(r,s)],n[i(r+1,s)],25]);function i(t,n){return t+n*(e+1)}this.particles=n,this.constraints=o,this.index=i}function simulate(e){const t=20*Math.cos(e/7e3)+40;windForce.set(Math.sin(e/2e3),Math.cos(e/3e3),Math.sin(e/1e3)),windForce.normalize(),windForce.multiplyScalar(t);const n=cloth.particles;if(params.enableWind){let e;const t=new THREE.Vector3,o=clothGeometry.index,i=clothGeometry.attributes.normal;for(let s=0,r=o.count;s<r;s+=3)for(let r=0;r<3;r++)e=o.getX(s+r),t.fromBufferAttribute(i,e),tmpForce.copy(t).normalize().multiplyScalar(t.dot(windForce)),n[e].addForce(tmpForce)}for(let e=0,t=n.length;e<t;e++){const t=n[e];t.addForce(gravity),t.integrate(TIMESTEP_SQ)}const o=cloth.constraints,i=o.length;for(let e=0;e<i;e++){const t=o[e];satisfyConstraints(t[0],t[1],t[2])}if(ballPosition.z=90*-Math.sin(e/600),ballPosition.x=70*Math.cos(e/400),params.showBall){sphere.visible=!0;for(let e=0,t=n.length;e<t;e++){const t=n[e].position;diff.subVectors(t,ballPosition),diff.length()<60&&(diff.normalize().multiplyScalar(60),t.copy(ballPosition).add(diff))}}else sphere.visible=!1;for(let e=0,t=n.length;e<t;e++){const t=n[e].position;t.y<-250&&(t.y=-250)}for(let e=0,t=pins.length;e<t;e++){const t=n[pins[e]];t.position.copy(t.original),t.previous.copy(t.original)}}const pinsFormation=[];function togglePins(){pins=pinsFormation[~~(Math.random()*pinsFormation.length)]}let container,stats,camera,scene,renderer,clothGeometry,sphere,object;function init(){container=document.getElementById("container"),scene=new THREE.Scene,scene.background=new THREE.Color("hsl(0, 100%, 50%)"),camera=new THREE.PerspectiveCamera(10,window.innerWidth/window.innerHeight,1,1e4),camera.position.set(1e3,50,1500);var e=new THREE.AmbientLight("hsl(180, 100%, 50%)");scene.add(e);const t=(new THREE.TextureLoader).load("/images/apluse-03.png");t.anisotropy=16;const n=new THREE.MeshToonMaterial({map:t,side:THREE.DoubleSide,alphaTest:.5});clothGeometry=new THREE.ParametricBufferGeometry(clothFunction,cloth.w,cloth.h),object=new THREE.Mesh(clothGeometry,n),object.position.set(0,0,0),object.castShadow=!0,scene.add(object),object.customDepthMaterial=new THREE.MeshDepthMaterial({depthPacking:THREE.RGBADepthPacking,map:t,alphaTest:.5});const o=new THREE.SphereGeometry(60,32,16),i=new THREE.MeshLambertMaterial;sphere=new THREE.Mesh(o,i),sphere.castShadow=!0,sphere.receiveShadow=!0,sphere.visible=!1,scene.add(sphere),renderer=new THREE.WebGLRenderer({antialias:!0}),renderer.setPixelRatio(window.devicePixelRatio),renderer.setSize(window.innerWidth,window.innerHeight),container.appendChild(renderer.domElement),renderer.outputEncoding=THREE.sRGBEncoding,renderer.shadowMap.enabled=!0;const s=new OrbitControls(camera,renderer.domElement);if(s.maxPolarAngle=.5*Math.PI,s.minDistance=1e3,s.maxDistance=5e3,s.enabled=!1,window.addEventListener("resize",onWindowResize),"undefined"!=typeof TESTING)for(let e=0;e<50;e++)simulate(500-10*e)}function onWindowResize(){camera.aspect=window.innerWidth/window.innerHeight,camera.updateProjectionMatrix(),renderer.setSize(window.innerWidth,window.innerHeight)}function animate(e){requestAnimationFrame(animate),simulate(e),render()}function render(){const e=cloth.particles;for(let t=0,n=e.length;t<n;t++){const n=e[t].position;clothGeometry.attributes.position.setXYZ(t,n.x,n.y,n.z)}clothGeometry.attributes.position.needsUpdate=!0,clothGeometry.computeVertexNormals(),sphere.position.copy(ballPosition),renderer.render(scene,camera)}pins=[6],pinsFormation.push(pins),pins=[0,1,2,3,4,5,6,7,8,9,10],pinsFormation.push(pins),pins=[0],pinsFormation.push(pins),pins=[],pinsFormation.push(pins),pins=[0,cloth.w],pinsFormation.push(pins),pins=pinsFormation[1],init(),animate(0);