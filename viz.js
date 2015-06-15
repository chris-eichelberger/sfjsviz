var view_width = 1024;
var view_height = view_width / 16.0 * 9.0;
var view_ratio = view_width / view_height;

var scene = new THREE.Scene();
var camera = new THREE.PerspectiveCamera( 75, view_ratio, 0.1, 1000 );
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

var node_factor = 0.075

var node_dx = unit_dist * node_factor;
var node_dy = unit_dist * node_factor;
var node_dz = unit_dist * node_factor;

var off_x = 0.5 * dx * cells_x;
var off_y = 0.5 * dy * cells_y;
var off_z = 0.5 * dz * cells_z;

var sfc_group = new THREE.Group();

var material = new THREE.MeshBasicMaterial( { color: 0x00ff00 } );

var sfcThree = {
  nodes: [],
  edges: []
};

var node_material_off = new THREE.MeshBasicMaterial( { color: 0x333333, transparent: true, opacity: 0.5 } );
var node_material_on = new THREE.MeshBasicMaterial( { color: 0x999999, transparent: false, opacity: 1.0 } );




function getPointVector(point) {
  var px = point[0] * dx - off_x;
  var py = point[1] * dy - off_y;
  var pz = point[2] * dz - off_z;
  return new THREE.Vector3(px, py, pz);
}

function getPoint(index) {
  if (index >= 0 && index < sfc.nodes.length) {
    return sfc.nodes[index].point;
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

function isPointSelected(index) {
  var point = getPoint(index);
  return isSelected(point[0], point[1], point[2]);
}


var pulses = [];
var pulse_speed_units_per_sec = 1.0;
var pulse_radius = unit_dist * 0.15;
//var pulse_material = new THREE.MeshBasicMaterial( { color: 0xFFFFFF, transparent: true, opacity: 0.80 } );
var pulse_material = new THREE.MeshBasicMaterial( { color: 0xFFFFFF, transparent: false, opacity: 0.80 } );
var pulse_segments = 16;

function stop_all_pulses() {
  for (i=0; i<pulses.length; i++) {
    scene.remove(pulses[i]);
  }
  pulses = [];
  render();
}

function update_pulses() {
  for (i=0; i<pulses.length; i++) {
    var pulse = pulses[i];
    var i0 = Math.max(0, Math.min(num_nodes - 1, Math.floor(pulse.userData.position)));
    var i1 = Math.min(num_nodes - 1, Math.max(0, Math.ceil(pulse.userData.position + 0.0001)));
    var frac = pulse.userData.position - Math.floor(pulse.userData.position);
    var p0 = getPointVector(getPoint(i0));
    var p1 = getPointVector(getPoint(i1));
    var delta_x = (p1.x - p0.x) * 1.0;
    var delta_y = (p1.y - p0.y) * 1.0;
    var delta_z = (p1.z - p0.z) * 1.0;
    pulse.position.set(p0.x + delta_x * frac, p0.y + delta_y * frac, p0.z + delta_z * frac);
  }
}

function move_pulses() {
  if (pulses.length < 1) return;

  var toRemove = [];
  var seconds = 0;
  var now_ms = (new Date()).getTime();

  for (i=0; i<pulses.length; i++) {
    seconds = (now_ms - pulses[i].userData.last_ms) / 1000.0;
    pulses[i].userData.position = pulse_speed_units_per_sec * seconds;
    if (pulses[i].userData.position > (num_nodes - 1.0)) {
      toRemove[i] = true;
    } else {
      toRemove[i] = false;
    }
  }

  var new_pulses = [];
  var j=0, k=0;
  for (i=0; i<pulses.length; i++) {
    if (toRemove[i]) scene.remove(pulses[i]);
    else new_pulses.push(pulses[i]);
  }

  if (new_pulses.length != pulses.length) {
  console.log("Old pulses:");
  for (i=0; i<pulses.length; i++) {
    console.log(pulses[i].userData["last_ms"]);
  }
  console.log("New pulses:");
  for (i=0; i<new_pulses.length; i++) {
    console.log(new_pulses[i].userData["last_ms"]);
  }
  }

  pulses = new_pulses;

  update_pulses();
}

function add_pulse() {
  var pulse_point = getPointVector(getPoint(0));
  var pulse_geom = new THREE.SphereGeometry(pulse_radius, pulse_segments, pulse_segments);
  var pulse = new THREE.Mesh( pulse_geom, pulse_material );
  pulse.position = pulse_point;
  pulse.userData["position"] = 0.0;
  pulse.userData["last_ms"] = (new Date()).getTime();
  pulses.push(pulse);
  scene.add(pulse);

  render();
}

function update_selection() {
  ranges = [];
  var node_states = [];
  for (i=0; i<num_nodes; i++) {
    node_states[i] = 0;
  }

  sfc_group.traverse(function(geo) {
    if (geo.userData && typeof geo.userData.sfc_index != "undefined") {
      var index = geo.userData.sfc_index;

      // update nodes
      if (geo.userData.sfc_type === "node") {
        if (isPointSelected(index)) {
          node_states[index] = 1;
          geo.material = node_material_on;
          geo.material.needsUpdate = true;
        } else {
          geo.material = node_material_off;
          geo.material.needsUpdate = true;
        }
      }

      if (geo.userData.sfc_type === "edge") {
        if (isPointSelected(index) && isPointSelected(index - 1)) {
          geo.material.setValues({
            transparent: false,
            opacity: 1.0
          });
        } else {
          geo.material.setValues({
            transparent: true,
            opacity: 0.25
          });
        }
      }
    }
  });

  // accumulate ranges
  var in_range = false;
  var range_start = -1;
  for (i=0; i<num_nodes; i++) {
    if (node_states[i] == 1) {
      if (!in_range) {
        in_range = true;
        range_start = i;
      }
    } else {
      if (in_range) {
        ranges.push({start: range_start, end: i-1});
        in_range = false;
      }
    }
  }
  if (in_range) {
    ranges.push({start: range_start, end: num_nodes - 1});
  }
  var ranges_list = "";
  for (i=0; i<ranges.length; i++) {
    if (i > 0) ranges_list = ranges_list + ", ";
    if (ranges[i].start == ranges[i].end) ranges_list = ranges_list + ranges[i].start;
    else ranges_list = ranges_list + ranges[i].start + "-" + ranges[i].end;
  }
  $( "#num-ranges" ).val(ranges.length);
  $( "#range-list" ).val(ranges_list);
}



function render() {
  requestAnimationFrame( render );

  if (rotate["x"]) { sfc_group.rotation.x += 0.001; }
  if (rotate["y"]) { sfc_group.rotation.y += 0.001; }
  if (rotate["z"]) { sfc_group.rotation.z += 0.001; }

  move_pulses();

  renderer.render( scene, camera );
}
render();

function rebuild() {
  // clear out whatever exists
  if (scene && sfc_group) {
    scene.remove(sfc_group)
    for (i=sfc_group.children.length-1; i>=0; i--) {
      scene.remove(sfc_group.children[i]);
    }
  }
  sfc_group = new THREE.Group();
  sfcThree = {
    nodes: [],
    edges: []
  };

  // add nodes
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
    node.userData["sfc_index"] = i;
    node.userData["sfc_type"] = "node";
    sfc_group.add(node);
    sfcThree.nodes.push(node);
  }

  // add lines
  var last_point = getPoint(0);
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
    color.setHSL((1.0 - p) * 2.0/3.0, 1.0, 0.75)

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
    line.userData["sfc_index"] = i;
    line.userData["sfc_type"] = "edge";
    sfcThree.edges.push(line);

    last_point = point;
    px0 = px1;
    py0 = py1;
    pz0 = pz1;
    last_sel = sel;
  }

  // add pulses
  update_pulses();
  for (i=0; i<pulses.length; i++) {
    sfc_group.add(pulses[i]);
  }

  scene.add(sfc_group);

  render();
}




