/* Author: Murphy Randle
    Just a very simple shallow water simulation.
    Heavily helped by code from: Paul Lewis: http://aerotwist.com/
*/

var cam, scene, renderer, geo, mesh, mat, projector;
var CPs = []; // For accessing all of the points on the surface.

// Params to change simulation:
var gridWidth = 50;
var gridRes = 22;

init();
// play();
mainLoop();

function init() {
    scene = new THREE.Scene();
    projector = new THREE.Projector();
    cam = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 10000);
    cam.position = new THREE.Vector3(50, 50, 50);
    scene.add(cam);

    grid = buildGrid(gridWidth, gridRes);

    for (var i = grid.length - 1; i >= 0; i--) {
        var p = grid[i];
        if (p.left && p.right && p.above && p.below) {
            p.setColor(new THREE.Color(0xff0000));
        }
    }

    // Set up rendering stuff:
    for (i = grid.length - 1; i >= 0; i--) {
        scene.add(grid[i]);
    }
    cam.lookAt(new THREE.Vector3(0, 0, 0));
    renderer = new THREE.CanvasRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);
    renderer.domElement.addEventListener('mouseup', onMouseUp, false);
}

function mainLoop() {
    renderer.render(scene, cam);
}

function play() {
    requestAnimationFrame(play);
    mainLoop();
}

// Methods for building
function buildGrid(width, res){
    var cellSize = width / res;
    var halfWidth = width / 2;
    var cols = res + 1;
    var range = (cols * cols) - 1;
    var result = [];
    var startPos = new THREE.Vector3(-halfWidth, 0, -halfWidth);

    // Make the points in space
    for (var i = cols - 1; i >= 0; i--) {
        for (var j = cols - 1; j >= 0; j--) {
            var p = constructCell(startPos);
            var change = new THREE.Vector3(cellSize * j, 0, cellSize * i);
            p.position.addSelf(change);
            result.unshift(p);
        }
    }

    // Set up sibling relationships:
    for (var i = result.length - 1; i >= 0; i--) {
        var p = result[i];
        if (i % cols !== 0){ p.left = result[i-1]; } // If we're not the left column.
        if ((i+1) % cols !== 0){ p.right = result[i+1]; } // If we're not the right column.
        if (i-cols >= 0){ p.above = result[i-cols]; } // If we're not the top row.
        if (i+cols <= range){ p.below = result[i+cols]; } // If we're not the top row.
    }

    return result;
}

// Define some objects to be used:
function constructCell(position){
    this.scale = 2;
    this.geo = new THREE.PlaneGeometry(this.scale, this.scale, this.scale, this.scale);
    this.mat = new THREE.MeshBasicMaterial({color: 0x0000ff, wireframe: false});
    this.mesh = new THREE.Mesh(this.geo, this.mat);
    this.mesh.position = new THREE.Vector3(position.x, position.y, position.z);
    this.mesh.velU = 0;
    this.mesh.velV = 0;
    this.mesh.curH = this.mesh.position.y;
    this.mesh.restH = 0;
    this.mesh.left = undefined;
    this.mesh.right = undefined;
    this.mesh.above = undefined;
    this.mesh.below = undefined;
    this.mesh.setColor = function(color){
        this.material.color = color;
    };
    this.mesh.setCurH = function(h){
        this.curH = h;
        this.position.y = h;
    };
    return this.mesh;
}

/////
/////
///// Events
/////

function onMouseUp(event) {
    event.preventDefault();

    // Find the square I clicked on.
    var mouseX = event.clientX;
    var mouseY = event.clientY;
    // Do the projecting.
    var vector = THREE.Vector3(mouse.x, mouse.y, 0.5);
    projector.unprojectVector(vector, cam);

}
