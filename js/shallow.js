/* Author: Murphy Randle
    Just a very simple shallow water simulation.
    Heavily helped by code from: Paul Lewis: http://aerotwist.com/
*/

var cam, scene, renderer, geo, mesh, mat, projector, grid;

// Params to change simulation:
var gridWidth = 65;
var gridRes = 46;
var cellSize;
var damp = 0.05;
var gravity = 0.1;
var time = 0.8;
var pokePower = 4;
var waterDepth = 1;
var subframes = 10;

// Visually:
var colorMax = new THREE.Color(0xF00000);
var heightMax = 3;
var colorMin = new THREE.Color(0x404040);
var heightMin = -1;
var heightRange = heightMax - heightMin;
var colorRange = [colorMax.r - colorMin.r,
                  colorMax.g - colorMin.g,
                  colorMax.b - colorMin.b];

init();
play();

function init() {
    scene = new THREE.Scene();
    projector = new THREE.Projector();
    cam = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 10000);
    cam.position = new THREE.Vector3(50, 50, 50);
    scene.add(cam);

    grid = buildGrid(gridWidth, gridRes);
    poke(grid[(grid.length - 1) / 2]);

    // Set up rendering stuff:
    for (i = grid.length - 1; i >= 0; i--) {
        scene.add(grid[i]);
        if (grid[i].edgeCell) {grid[i].setColor(new THREE.Color(0xE9D55E));}
    }
    cam.lookAt(new THREE.Vector3(0, -20, 0));
    renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);
    renderer.domElement.addEventListener('mouseup', onMouseUp, false);
}

function mainLoop() {
    simulate();
    updateColors();
    renderer.render(scene, cam);
}

function play() {
    requestAnimationFrame(play);
    mainLoop();
}

// Methods for building
function buildGrid(width, res){
    cellSize = width / res;
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
        if (i % cols !== 0){ p.l = result[i-1]; } // If we're not the.l column.
        if ((i+1) % cols !== 0){ p.r = result[i+1]; } // If we're not the.r column.
        if (i-cols >= 0){ p.a = result[i-cols]; } // If we're not the top row.
        if (i+cols <= range){ p.b = result[i+cols]; } // If we're not the top row.
        if (p.l && p.r && p.a && p.b) {p.edgeCell = false;}
        p.number = i;
    }

    return result;
}

// Define some objects to be used:
function constructCell(position){
    this.scale = cellSize + 0.1 * cellSize;
    // this.geo = new THREE.PlaneGeometry(this.scale, this.scale, 1, 1);
    this.geo = new THREE.SphereGeometry(this.scale, 4, 4);
    this.mat = new THREE.MeshBasicMaterial({color: 0xC53232, wireframe: false});
    this.mesh = new THREE.Mesh(this.geo, this.mat);
    this.mesh.position = new THREE.Vector3(position.x, position.y, position.z);
    this.mesh.U = 0; // The velocity in the X direction.
    this.mesh.V = 0; // The velocity in the Z direction.
    this.mesh.h = this.mesh.position.y; // The current position of the fluid.
    this.mesh.H = waterDepth; // The rest height of the liquid.
    this.mesh.l = undefined; // The cell to the left.
    this.mesh.r = undefined; // The cell to the right.
    this.mesh.a = undefined; // The cell above.
    this.mesh.b = undefined; // The cell below.
    this.mesh.edgeCell = true;
    this.number = undefined;
    this.mesh.setColor = function(color){
        this.material.color = color;
    };
    this.mesh.hSet = function(h){
        this.h = h;
        this.position.y = h;
    };
    return this.mesh;
}

///// Events
/////

function onMouseUp(event) {
    event.preventDefault();

    // Find the square I clicked on.
    var mouseX = (event.clientX / window.innerWidth) * 2 - 1;
    var mouseY = -(event.clientY / window.innerHeight) * 2 + 1;
    var vector = new THREE.Vector3(mouseX, mouseY, 0.5);
    projector.unprojectVector(vector, cam);
    var ray = new THREE.Ray(cam.position, vector.subSelf(cam.position).normalize());
    var hit = ray.intersectObjects(grid)[0];
    if(hit){
        poke(hit.object);
    }
}

function poke(cell){
    cell.hSet(pokePower);
    cell.l.hSet(pokePower);
    cell.r.hSet(pokePower);
    cell.a.hSet(pokePower);
    cell.b.hSet(pokePower);
}

///// Simulation
/////

function simulate() {
    for (var i = grid.length - 1; i >= 0; i--) {
        var p = grid[i];
        if (!p.edgeCell) {
            p.U += time * ((-gravity * ((p.r.h - p.l.h) / 2 * cellSize)) - (damp * p.U));
            p.V += time * ((-gravity * ((p.a.h - p.b.h) / 2 * cellSize)) - (damp * p.V));
            var hNew = time * (
                -((p.r.U*(p.r.H + p.r.h) - p.l.U*(p.l.H + p.l.h)) / 2 * cellSize) -
                ((p.a.V*(p.a.H + p.a.h) - p.b.V*(p.b.H + p.b.h)) / 2 * cellSize)
                );
            p.hSet(p.h + hNew);
        }
    }
}

function updateColors(){
    for (var i = grid.length - 1; i >= 0; i--) {
        var p = grid[i];
        var red = (p.h / heightRange * colorRange[0]) + colorMin.r;
        var green = (p.h / heightRange * colorRange[1]) + colorMin.g;
        var blue = (p.h / heightRange * colorRange[2]) + colorMin.b;
        p.material.color.r = red;
        p.material.color.g = green;
        p.material.color.b = blue;
    }
}
