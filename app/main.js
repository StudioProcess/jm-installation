import './load3.js';
import '../node_modules/three/examples/js/controls/OrbitControls.js';


const W = 1280;
const H = 720;
const CAPTURE_RATIO = 0.25; // For capture resolution
const MODIFIED_HOTKEYS = true;
const MESH_COUNT = 80;

const caps = { // Camera Capabilities
  video: {
    width: W * CAPTURE_RATIO,
    height: H * CAPTURE_RATIO,
  }
};

const SQRT3 = Math.sqrt(3);

let meshCount = MESH_COUNT; // ~ 10-200

let renderer, scene, camera;
let controls; // eslint-disable-line no-unused-vars
let mesh, texture;

(function main() {

  setup(); // set up scene
  loop(); // start game loop

})();



// Generate coordiantes for an equilateral triangle
// Format: [x0, y0, 0, x1, y1, 0, x2, y2, 0]
//   offset: position of geometric center
//   r: radius of inner circle
//   flip: flip horizontally?
function equitri(offset=[0,0], rx=1, ry=1, flip=false) {
  let f = flip ? -1 : 1;
  return [
    offset[0] + f*2*rx, offset[1] + 0,           0,
    offset[0] -   f*rx, offset[1] + f*3*ry/SQRT3, 0,
    offset[0] -   f*rx, offset[1] - f*3*ry/SQRT3, 0,
  ];
}

// Geometry for a triangle mesh covering the whole screen (i.e. [-1, 1])
// Contains position and uv attributes
// r: radius of inner circle
function meshgeo(r=0.01) {
  // let dx = 4 * r;
  // let dy = 3 * r / SQRT3; // = a/2
  
  let aspect = W/H;
  
  let w = 3 * r / aspect; // Outer width of a triangle
  let h = 3 * r / SQRT3; // = a/2  // Outer height of a triangle
  

  
  let nx = Math.ceil( (2+r) / w );
  let ny = Math.ceil( 2 / h );
  let pos = [];
  let uv = [];

  // console.log(nx, ny);

  for (let j=0; j<ny; j++) {
    for (let i=0; i<nx; i++) {
      let flip = (i+j) % 2;
      let ox = w * i + flip * r/aspect - 1; // flipped tris are offset by r to the right
      let oy = h * j - 1;

      let tri = equitri([ox,oy], r/aspect, r, flip);
      pos = pos.concat( tri );

      let c = [1-(ox+1)/2, (oy+1)/2]; // uv coordinates based on triangle center
      uv = uv.concat(c, c, c); // add 3x (for each triangle vertex)
    }
  }

  let geo = new THREE.BufferGeometry();
  geo.addAttribute( 'position', new THREE.BufferAttribute(new Float32Array(pos), 3) );
  geo.addAttribute( 'uv', new THREE.BufferAttribute(new Float32Array(uv), 2) );
  return geo;
}


function startWebcam(append = false) {
  let videoElement = document.createElement('video');
  videoElement.autoplay = true;
  if (append) { document.body.appendChild(videoElement); }

  navigator.mediaDevices.getUserMedia(caps).then(stream => {
    // console.log(stream);
    videoElement.srcObject = stream;
    let settings = stream.getVideoTracks()[0].getSettings();
    console.log(settings);
  }).catch(err => {
    console.error('Error obtaining Webcam:', err);
  });

  return videoElement;
}


function setup() {

  renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true,
    preserveDrawingBuffer: true
  });
  renderer.setSize( W, H );
  renderer.setPixelRatio( window.devicePixelRatio );
  renderer.setClearColor( 0xFFFFFF );
  document.body.appendChild( renderer.domElement );

  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera( 75, W / H, 0.01, 1000 );
  // controls = new THREE.OrbitControls( camera, renderer.domElement );
  camera.position.z = 1.26;


  // let v1 = equitri( [-2,0], 1, false );
  // let v2 = equitri( [2, 0], 1, true  );
  // let v = new Float32Array( v1.concat(v2) );
  // let geo = new THREE.BufferGeometry();
  // geo.addAttribute( 'position', new THREE.BufferAttribute(v, 2) );

  // Setup webcam texture
  let videoElement = startWebcam();
  texture = new THREE.VideoTexture(videoElement);
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.format = THREE.RGBFormat;

  let geo = meshgeo(2/meshCount);
  let mat = new THREE.MeshBasicMaterial({
    color: 0xFFFFFF, // JM colors: 0x1424fa, 0xFFFFFF, 0x251e21, 0xfc4d40
    map: texture
  });
  mesh = new THREE.Mesh( geo, mat );
  mesh.scale.x = W/H;
  scene.add( mesh );

  // // Test quad with video texture
  // var geometry = new THREE.PlaneBufferGeometry( 2, 2*9/16, 1 );
  // var material = new THREE.MeshBasicMaterial({ map:texture });
  // var plane = new THREE.Mesh( geometry, material );
  // plane.position.z = -0.1;
  // scene.add( plane );
}

function updateMeshCount(newMeshCount) {
  if (newMeshCount !== undefined) { meshCount = newMeshCount; }
  mesh.geometry = meshgeo(2/meshCount);
}


function loop(time) { // eslint-disable-line no-unused-vars

  requestAnimationFrame( loop );
  renderer.render( scene, camera );

}


// NOTE: Needs THREE.WebGLRenderer with preserveDrawingBuffer:true
function saveCanvas() {
  let canvas = document.querySelector('canvas');
  let link = document.createElement('a');
  let timestamp = new Date().toISOString();
  link.download = timestamp + '.png';
  link.href = canvas.toDataURL();
  link.click();
}

function modifiedKey(e) {
  // NOTE: meta is Cmd on Mac
  return e.ctrlKey || e.altKey || e.metaKey;
}


document.addEventListener('keydown', e => {
  // console.log(e.key, e.keyCode, e);
  
  if ( MODIFIED_HOTKEYS && !modifiedKey(e) ) return; // Allow only modified keys
  
  if ( e.code == 'KeyF') { // F .. Fullscreen
    if (!document.webkitFullscreenElement) {
      document.querySelector('body').webkitRequestFullscreen();
    } else { document.webkitExitFullscreen(); }
    e.preventDefault();
  }
  
  else if (e.code == 'KeyS') { // S .. Save frame
    saveCanvas();
    e.preventDefault();
  }
  
  else if (e.code == 'Digit1') { updateMeshCount(32); }
  else if (e.code == 'Digit2') { updateMeshCount(48); }
  else if (e.code == 'Digit3') { updateMeshCount(64); }
  else if (e.code == 'Digit4') { updateMeshCount(80); }
  else if (e.code == 'Digit5') { updateMeshCount(96); }
  else if (e.code == 'Digit6') { updateMeshCount(112); }
  else if (e.code == 'Digit7') { updateMeshCount(128); }
  else if (e.code == 'Digit8') { updateMeshCount(160); }
  else if (e.code == 'Digit0') { updateMeshCount(MESH_COUNT); }
  
  if (e.code.startsWith('Digit')) { e.preventDefault(); }
  
});
