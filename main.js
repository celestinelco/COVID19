import "./js/three.js"
import "./js/OrbitControls.js"
// import "./js/three-globe/src/three-globe.js"

// Set up renderer
var renderer = new THREE.WebGLRenderer();
renderer.setSize( window.innerWidth, window.innerHeight );
document.body.appendChild( renderer.domElement );

// Set up scene
var scene = new THREE.Scene();

// Set up camera
var camera = new THREE.PerspectiveCamera(
   75,
   window.innerWidth / window.innerHeight,
   0.1,
   1000
);
camera.position.z = 5;

// Set up orbit controls
var controls = new THREE.OrbitControls( camera, renderer.domElement );
controls.enablePan = false;
controls.minDistance = 1.5;
controls.maxDistance = 6.0;
controls.target = new THREE.Vector3(0, 0, 0);

// cube stuff
// var geometry = new THREE.BoxGeometry();
// var material = new THREE.MeshBasicMaterial( { color: 0x00ff00 } );
// var cube = new THREE.Mesh( geometry, material );
// scene.add( cube );




function animate() {
	requestAnimationFrame( animate );

   renderer.render( scene, camera );
}
animate();
