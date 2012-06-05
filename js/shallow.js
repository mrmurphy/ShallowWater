/* Author: Murphy Randle
    Just a very simple shallow water simulation.
*/

var cam, scene, renderer, geo, mesh, mat;
var CPs = []; // For accessing all of the points on the surface.

// Params to change simulation:
var gridWidth = 50;
var gridRes = 10;

init();
play();

function init() {
    scene = new THREE.Scene();

    cam = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 10000);
    cam.position = new THREE.Vector3(50, 50, 50);
    scene.add(cam);

    geo = new THREE.PlaneGeometry(gridWidth,gridWidth,gridRes,gridRes);
    mat = new THREE.MeshBasicMaterial({color: 0x808080, wireframe: true});
    mesh = new THREE.Mesh(geo, mat);

    // Set up custom data structures.
    var cols = gridRes + 1;
    var loopRange = cols * cols - 1;
    var verts = mesh.geometry.vertices;
    for (i = loopRange; i >= 0; i--) {
        var v = new controlPoint(verts[i]);
        // Set up sibling relationships.
        if (i % cols !== 0){ v.left = verts[i-1]; } // If we're not the left column.
        if (i+1 % cols !== 0){ v.right = verts[i+1]; } // If we're not the right column.
        if (i-cols >= 0){ v.above = verts[i-cols]; } // If we're not the top row.
        if (i+cols <= loopRange){ v.below = verts[i+cols]; } // If we're not the top row.
        // Push the point to the front of the array.
        CPs.unshift(v);
    }


    // Set up rendering stuff:
    scene.add(mesh);
    cam.lookAt(mesh.position);
    renderer = new THREE.WebGLRenderer();
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
    this.velU = 0;
    this.velV = 0;
    this.curH = this.vertex.y;
    this.restH = 0;
    this.left = undefined;
    this.right = undefined;
    this.above = undefined;
    this.below = undefined;

    this.setCurH = function(h){
        this.curH = h;
        this.vertex.y = h;
    };
}
