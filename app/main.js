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
// Format: [x0, y0, 0, x1, y1, 0, x2, y2, 0]
//   offset: position of geometric center
//   r: radius of inner circle
//   flip: flip horizontally?
function equitri(offset=[0,0], r=1, flip=false) {
  let f = flip ? -1 : 1;
  return [ 
    offset[0] + f*2*r, offset[1] + 0,           0,
    offset[0] -   f*r, offset[1] + f*3*r/sqrt3, 0,
    offset[0] -   f*r, offset[1] - f*3*r/sqrt3, 0,
  ];
}

// Geometry for a triangle mesh covering the whole screen
// Contains position and uv attributes
// r: radius of inner circle
function meshgeo(r=0.01) {
  // let dx = 4 * r;
  // let dy = 3 * r / sqrt3; // = a/2
  let w = 3 * r;
  let h = 3 * r / sqrt3; // = a/2
  
  let nx = Math.ceil( (2+r) / w );
  let ny = Math.ceil( 2 / h );
  let pos = [];
  
  // console.log(nx, ny);
  
  for (let j=0; j<ny; j++) {
    for (let i=0; i<nx; i++) {
      let flip = (i+j) % 2;
      let ox = w * i + flip * r - 1; // flipped tris are offset by r to the right
      let oy = h * j - 1;
      let tri = equitri([ox,oy], r, flip);
      pos = pos.concat( tri );
    }
  }
  
  let geo = new THREE.BufferGeometry();
  geo.addAttribute( 'position', new THREE.BufferAttribute(new Float32Array(pos), 3) );
  return geo;
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
  

  
  // let v1 = equitri( [-2,0], 1, false );
  // let v2 = equitri( [2, 0], 1, true  );
  // let v = new Float32Array( v1.concat(v2) );
  // let geo = new THREE.BufferGeometry();
  // geo.addAttribute( 'position', new THREE.BufferAttribute(v, 2) );
  
  let geo = meshgeo(0.02);
  
  let mat = new THREE.MeshBasicMaterial({ color: 0x1e90ff, wireframe: true });
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
