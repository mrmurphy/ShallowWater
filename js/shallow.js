/* Author: Murphy Randle
    Just a very simple shallow water simulation.
*/

var cam, scene, renderer, geo, mesh, mat;
var CPs; // For accessing all of the points on the surface.

init();
play();

function init() {
    scene = new THREE.Scene();

    cam = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 10000);
    cam.position.z = 50;
    cam.position.y = 50;
    cam.position.x = 50;
    scene.add(cam);

    geo = new THREE.PlaneGeometry(50,50,10,10);
    mat = new THREE.MeshBasicMaterial({color: 0x505050, wireframe: true});
    mesh = new THREE.Mesh(geo, mat);

    // Set up custom data structures.
    v = new controlPoint(mesh.geometry.vertices[60]);
    v.vertex.y += 50;

    // Set up rendering stuff:
    scene.add(mesh);
    cam.lookAt(mesh.position);
    renderer = new THREE.CanvasRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);
}

function mainLoop() {
    renderer.render(scene, cam);
}

function play() {
    requestAnimationFrame(play);
    mainLoop();
}

// Define some objects to be used:
function controlPoint(vert){
    this.vertex = vert;
    this.name = "hal";
}
