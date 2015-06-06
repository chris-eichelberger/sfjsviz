var view_width = 800;
var view_height = view_width / 16.0 * 9.0;
var view_ratio = view_width / view_height;

var scene = new THREE.Scene();
var camera = new THREE.PerspectiveCamera( 75, view_ratio, 0.1, 1000 );

var renderer = new THREE.WebGLRenderer();
renderer.setSize( view_width, view_height );
document.body.appendChild( renderer.domElement );

var geometry = new THREE.BoxGeometry( 1, 1, 1 );
var material = new THREE.MeshBasicMaterial( { color: 0x00ff00 } );
var cube = new THREE.Mesh( geometry, material );
//scene.add( cube );

var cells_x = 1 + (sfc.bounds[0].max - sfc.bounds[0].min);
var cells_y = 1 + (sfc.bounds[1].max - sfc.bounds[1].min);
var cells_z = 1 + (sfc.bounds[2].max - sfc.bounds[2].min);
var max_cells = Math.max(cells_x, cells_y, cells_z);

var max_size = 7.0;

var unit_dist = max_size / max_cells;

var dx = unit_dist;
var dy = unit_dist;
var dz = unit_dist;

var off_x = 0.5 * dx * cells_x;
var off_y = 0.5 * dy * cells_y;
var off_z = 0.5 * dz * cells_z;


// create the SFC shape
var lines_geometry = new THREE.Geometry();
for (var i=0; i < sfc.nodes.length; i++) {
  var j = -1;
  for (var k=0; j<0 && k<sfc.nodes.length; k++) {
    if (sfc.nodes[k].index == i) j = k;
  }
  var px = sfc.nodes[j].point[0] * dx - off_x;
  var py = sfc.nodes[j].point[1] * dy - off_y;
  var pz = sfc.nodes[j].point[2] * dz - off_z;

  lines_geometry.vertices.push(
    new THREE.Vector3(px, py, pz)
  );
}
var lines_material = new THREE.MeshBasicMaterial( { color: 0xff8040 } );
var lines = new THREE.Line( lines_geometry, lines_material );
scene.add( lines );

camera.position.z = 5;

function render() {
  requestAnimationFrame( render );
  lines.rotation.x += 0.001;
  lines.rotation.y += 0.002;
  renderer.render( scene, camera );
}
render();
