var view_width = 800;
var view_height = view_width / 16.0 * 9.0;
var view_ratio = view_width / view_height;

var scene = new THREE.Scene();
var camera = new THREE.PerspectiveCamera( 90, view_ratio, 0.1, 1000 );
camera.position.z = 5;

var renderer = new THREE.WebGLRenderer();
renderer.setSize( view_width, view_height );
document.body.appendChild( renderer.domElement );

controls = new THREE.OrbitControls( camera, renderer.domElement );
controls.target.set(0, 0, 0);
controls.rotateSpeed = 1.0;
controls.zoomSpeed = 1.2;
controls.panSpeed = 0.8;
controls.noZoom = false;
controls.noPan = false;
controls.staticMoving = true;
controls.dynamicDampingFactor = 0.3;
controls.keys = [ 65, 83, 68 ];
controls.addEventListener( 'change', render );



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

var node_dx = unit_dist * 0.1;
var node_dy = unit_dist * 0.1;
var node_dz = unit_dist * 0.1;

var off_x = 0.5 * dx * cells_x;
var off_y = 0.5 * dy * cells_y;
var off_z = 0.5 * dz * cells_z;

function getPoint(index) {
  for (var k=0; k<sfc.nodes.length; k++) {
    if (sfc.nodes[k].index == index) return sfc.nodes[k].point;
  }
  console.log("Failed to find point:  index " + index + ", #points " + sfc.nodes.length)
  return null;
}

function isSelected(x, y, z) {
  if (x < sel_x[0] || x > sel_x[1]) return false;
  if (y < sel_y[0] || y > sel_y[1]) return false;
  if (z < sel_z[0] || z > sel_z[1]) return false;

  return true;
}

function toggle_rotation() {
  rotate = !rotate;
  if (rotate) $( "#btn_rotate" )[0].value = "stop rotating";
  else $( "#btn_rotate" )[0].value = "rotate";
}

function toggle_rotation_axis(axis) {
  rotate[axis] = !rotate[axis];
  var btnid = "#btn_rotate_" + axis;
  if (rotate[axis]) $( btnid )[0].value = "stop rotating " + axis;
  else $( btnid )[0].value = "rotate " + axis;
}

function toggle_rotation_x() { toggle_rotation_axis("x"); }
function toggle_rotation_y() { toggle_rotation_axis("y"); }
function toggle_rotation_z() { toggle_rotation_axis("z"); }

function reset_rotation_axis(axis) {
  sfc_group.rotation[axis] = 0.0;
}

function update_selection() {
  console.log("update_selection()");
}




var sfc_group = new THREE.Group();

var material = new THREE.MeshBasicMaterial( { color: 0x00ff00 } );

var sfcThree = {
  nodes: [],
  edges: []
};

// add nodes
var node_material_off = new THREE.MeshBasicMaterial( { color: 0x333333, transparent: true, opacity: 0.5 } );
var node_material_on = new THREE.MeshBasicMaterial( { color: 0x999999, transparent: false, opacity: 1.0 } );
for (var i=0; i < sfc.nodes.length; i++) {
  var point = getPoint(i);
  var px = point[0] * dx - off_x;
  var py = point[1] * dy - off_y;
  var pz = point[2] * dz - off_z;
  var is_selected = isSelected(point[0], point[1], point[2]);

  var node_geometry = new THREE.BoxGeometry( node_dx, node_dy, node_dz );
  var node = null;
  if (is_selected) node = new THREE.Mesh( node_geometry, node_material_on );
  else node = new THREE.Mesh( node_geometry, node_material_off );
  node.position.x = px;
  node.position.y = py;
  node.position.z = pz;
  sfc_group.add(node);
  sfcThree.nodes.push(node);
}

// add lines
var last_point = getPoint(0);
console.log(last_point)
var px0 = last_point[0] * dx - off_x;
var py0 = last_point[1] * dy - off_y;
var pz0 = last_point[2] * dz - off_z;
var last_sel = isSelected(last_point[0], last_point[1], last_point[2]);
for (var i=1; i < sfc.nodes.length; i++) {
  var point = getPoint(i);
  var px1 = point[0] * dx - off_x;
  var py1 = point[1] * dy - off_y;
  var pz1 = point[2] * dz - off_z;
  var sel = isSelected(point[0], point[1], point[2]);

  var line_geometry = new THREE.Geometry();
  line_geometry.vertices.push(
    new THREE.Vector3(px0, py0, pz0),
    new THREE.Vector3(px1, py1, pz1)
  )

  var color = new THREE.Color();
  var p = (i - 0.0) / (sfc.nodes.length - 1.0)
  color.setHSL(p * 2.0/3.0, 0.8, 0.5)

  var line_material = new THREE.MeshBasicMaterial();
  line_material.color = color;
  if (sel && last_sel) {
    line_material.transparent = false;
    line_material.opacity = 1.0;
  }
  else {
    line_material.transparent = true;
    line_material.opacity = 0.25;
  }
  var line = new THREE.Line( line_geometry, line_material );
  sfc_group.add(line);
  sfcThree.edges.push(line);

  last_point = point;
  px0 = px1;
  py0 = py1;
  pz0 = pz1;
  last_sel = sel;
}

scene.add(sfc_group);


function render() {
  requestAnimationFrame( render );

  if (rotate["x"]) { sfc_group.rotation.x += 0.001; }
  if (rotate["y"]) { sfc_group.rotation.y += 0.001; }
  if (rotate["z"]) { sfc_group.rotation.z += 0.001; }

  renderer.render( scene, camera );
}
render();

