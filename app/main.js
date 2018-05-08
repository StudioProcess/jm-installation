const W = 1280;
const H = 800;

let renderer, scene, camera;
let controls; // eslint-disable-line no-unused-vars
const sqrt3 = Math.sqrt(3);

(function main() {  
  
  setup(); // set up scene
  loop(); // start game loop

})();



// Generate coordiantes for an equilateral triangle
//   offset: position of geometric center
//   r: radius of inner circle
//   flip: flip horizontally?

function equitri(offset=[0,0], r=1, flip=false) {
  let f = flip ? -1 : 1;
  return [ 
    offset[0] + f*2*r, offset[1] + 0,
    offset[0] -   f*r, offset[1] + f*3*r/sqrt3,
    offset[0] -   f*r, offset[1] - f*3*r/sqrt3,
  ];
}

function setup() {
  
  renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true
  });
  renderer.setSize( W, H );
  renderer.setPixelRatio( window.devicePixelRatio );
  document.body.appendChild( renderer.domElement );
  
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera( 75, W / H, 0.01, 1000 );
  controls = new THREE.OrbitControls( camera, renderer.domElement );
  camera.position.z = 2;
  

  
  let v1 = equitri( [-2,0], 1, false );
  let v2 = equitri( [2, 0], 1, true  );
  let v = new Float32Array( v1.concat(v2) );
  
  let geo = new THREE.BufferGeometry();
  geo.addAttribute( 'position', new THREE.BufferAttribute(v, 2) );
  
  let mat = new THREE.MeshBasicMaterial({ color: 0x1e90ff, wireframe: false });
  let mesh = new THREE.Mesh( geo, mat );
  scene.add( mesh );
  
}


function loop(time) { // eslint-disable-line no-unused-vars
  
  requestAnimationFrame( loop );
  renderer.render( scene, camera );
  
}


document.addEventListener('keydown', e => {
  // console.log(e.key, e.keyCode, e);
  
  if (e.key == 'f') { // f .. fullscreen
    if (!document.webkitFullscreenElement) {
      document.querySelector('body').webkitRequestFullscreen();
    } else { document.webkitExitFullscreen(); }
  }
  
});
