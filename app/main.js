import './load3.js';
import '../node_modules/three/examples/js/controls/OrbitControls.js';


const W = 1280;
const H = 720;
const CAPTURE_RATIO = 0.25; // For capture resolution
const MODIFIED_HOTKEYS = false;
const MESH_COUNT_IDX_DEFAULT = 3;

// JM colors: 0x1424fa, 0xFFFFFF, 0x251e21, 0xfc4d40
const COLORS = [ 0xFFFFFF, 0x1424fa, 0xfc4d40 ];
const MESH_COUNTS = [ 32, 48, 64, 80, 96, 112, 128 ];


const caps = { // Camera Capabilities
  video: {
    width: W * CAPTURE_RATIO,
    height: H * CAPTURE_RATIO,
  }
};

const SQRT3 = Math.sqrt(3);

let meshCount = MESH_COUNTS[MESH_COUNT_IDX_DEFAULT]; // ~ 10-200

let renderer, scene, camera;
let controls; // eslint-disable-line no-unused-vars
let mesh, texture;

(function main() {

  setup(); // set up scene
  loop(); // start game loop

})();



// Generate coordiantes for an equilateral triangle
// Format: [x0,y0,0, x1,y1,0,  x2,y2,0]
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
  // Triangle Spacing
  let aspect = W/H;
  let w = 3 * r / aspect; // Outer width of a triangle
  let h = 3 * r / SQRT3;  // = a/2  // Half Outer height of a triangle
  
  // Number of triangles to generate
  let nx = Math.ceil( (2+r) / w );
  let ny = Math.ceil( 2 / h + 1);
  
  // Offset for centering 
  let cx = -1 + (w*nx - 2) / -2 + r/2; 
  let cy = -1 + (h*(ny-1) - 2) / -2;

  let pos = [];
  let uv = [];

  console.log(nx, ny, r);

  for (let j=0; j<ny; j++) {
    for (let i=0; i<nx; i++) {
      let flip = (i+j) % 2;
      let ox = w * i + (flip * r/aspect) + cx; // flipped tris are offset by r to the right
      let oy = h * j + cy;

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
  // camera = new THREE.PerspectiveCamera( 75, W / H, 0.01, 1000 );
  camera = new THREE.OrthographicCamera( -1, 1, 1, -1, 1, 1000 );
  camera.position.z = 1.26;
  // controls = new THREE.OrbitControls( camera, renderer.domElement );

  // Setup webcam texture
  let videoElement = startWebcam();
  texture = new THREE.VideoTexture(videoElement);
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.format = THREE.RGBFormat;

  let geo = meshgeo(2/meshCount);
  let mat = new THREE.MeshBasicMaterial({
    color: COLORS[0],
    map: texture
  });
  mesh = new THREE.Mesh( geo, mat );
  // mesh.scale.x = W/H; // only needed for perspective camera
  window.mesh = mesh;
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


function setMeshCount(idx) {
  updateMeshCount( MESH_COUNTS[idx] );
}

let meshCountIdx = MESH_COUNT_IDX_DEFAULT;
function nextMeshCount(offset = 1) {
  meshCountIdx += offset;
  meshCountIdx %= MESH_COUNTS.length;
  if (meshCountIdx < 0) { meshCountIdx += MESH_COUNTS.length; }
  setMeshCount(meshCountIdx);
}


function setColor(idx) { 
  mesh.material.color = new THREE.Color( COLORS[idx] );
}

let colorIdx = 0;
function nextColor(offset = 1) {
  colorIdx += offset;
  colorIdx %= COLORS.length;
  if (colorIdx < 0) { colorIdx += COLORS.length; }
  setColor(colorIdx);
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


function reset() {
  setMeshCount(MESH_COUNT_IDX_DEFAULT); 
  setColor(0);
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
  
  else if (e.code == 'Digit1') { setMeshCount(0); }
  else if (e.code == 'Digit2') { setMeshCount(1); }
  else if (e.code == 'Digit3') { setMeshCount(2); }
  else if (e.code == 'Digit4') { setMeshCount(3); }
  else if (e.code == 'Digit5') { setMeshCount(4); }
  else if (e.code == 'Digit6') { setMeshCount(5); }
  else if (e.code == 'Digit7') { setMeshCount(6); }
  else if (e.code == 'Digit0') { setMeshCount(MESH_COUNT_IDX_DEFAULT); }
  
  else if (e.code == 'ArrowRight') { nextColor(); }
  else if (e.code == 'ArrowLeft')  { nextColor(-1); }
  
  else if (e.code == 'ArrowUp')   { nextMeshCount(); }
  else if (e.code == 'ArrowDown') { nextMeshCount(-1); }
  
  else if (e.code == 'Backspace') { reset(); e.preventDefault(); }
  
  
  if (e.code.startsWith('Digit') || e.code.startsWith('Arrow')) { e.preventDefault(); }
});
