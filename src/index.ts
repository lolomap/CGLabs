import * as vertex from './vert'
import * as frag from './frag'
import * as utils from './utils'
import {mat4, ReadonlyVec3} from 'gl-matrix'
import { loadOBJs } from './files';

const taskId = document.title;

let rotationX = 0.0;
let rotationY = 0.0;
let scale = 0.75;
let moveX = 0.0; 
let lightIntensivity = 5.0;
let lightLinear = 0.09;
let lightQuadratic = 0.032;
let isPhongShading = true;
let ambient = 0;
let diff = 1;
let specular = 0.5;
const speed = 1.0;

let lightModel = 0; const lightModelMax = 1;
const lightModelNames = {
    0: 'Lambert',
    1: 'Phong'
}

let keyPressed: string;

let snowmanOBJ: utils.OBJ;

utils.setupGL();
const gl = utils.gl;

function drawModel(vertexPosLoc: number, vertexNormalLoc: number, renderObj: utils.RenderObj) {
    gl.bindBuffer(gl.ARRAY_BUFFER, renderObj.verticesBuffer);
    gl.vertexAttribPointer(vertexPosLoc, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vertexPosLoc);

    gl.bindBuffer(gl.ARRAY_BUFFER, renderObj.normalsBuffer);
    gl.vertexAttribPointer(vertexNormalLoc, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vertexNormalLoc);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, renderObj.indicesBuffer);
    gl.drawElements(gl.TRIANGLES, renderObj.elementsCount, gl.UNSIGNED_SHORT, 0);
}

function drawObject(
    shader: WebGLShader,
    pos: ReadonlyVec3,
    viewProjection: mat4,
    renderObj: utils.RenderObj
) {
    gl.useProgram(shader);

    let vertexPosLoc = gl.getAttribLocation(shader, "inPosition");
    let vertexNormalLoc = gl.getAttribLocation(shader, "inNormal");

    let viewProjectionLoc = gl.getUniformLocation(shader, "viewProjection");
    let modelLoc = gl.getUniformLocation(shader, "model");
    gl.uniformMatrix4fv(viewProjectionLoc, false, viewProjection as Float32Array);

    let lightPosLoc = gl.getUniformLocation(shader, "lightPosition");
    let lightColorLoc = gl.getUniformLocation(shader, "lightColor");
    let lightIntensLoc = gl.getUniformLocation(shader, "lightIntensivity");
    let lightLinLoc = gl.getUniformLocation(shader, "lightLinear");
    let lightQuadLoc = gl.getUniformLocation(shader, "lightQuadratic");
    gl.uniform3fv(lightPosLoc, [0.0, 5.0, 2.0]);
    gl.uniform3fv(lightColorLoc, [1.0, 1.0, 1.0]);
    gl.uniform1f(lightIntensLoc, lightIntensivity);
    gl.uniform1f(lightLinLoc, lightLinear);
    gl.uniform1f(lightQuadLoc, lightQuadratic);

    let ambientLoc = gl.getUniformLocation(shader, 'ambientI');
    let diffuseLoc = gl.getUniformLocation(shader, 'diffuseI');
    let specularLoc = gl.getUniformLocation(shader, 'specularI');
    gl.uniform1f(ambientLoc, ambient);
    gl.uniform1f(diffuseLoc, diff);
    gl.uniform1f(specularLoc, specular);

    let model = mat4.create();
    mat4.translate(model, model, [pos[0] + moveX, pos[1], pos[2]]);
    mat4.rotate(model, model, rotationY * (Math.PI / 180), [1.0, 0.0, 0.0]);
    mat4.rotate(model, model, rotationX * (Math.PI / 180), [0.0, 1.0, 0.0]);
    mat4.scale(model, model, [scale, scale, scale]);
    gl.uniformMatrix4fv(modelLoc, false, model as Float32Array);
    drawModel(vertexPosLoc, vertexNormalLoc, renderObj);
}

const inputHandlers = {
    'ArrowLeft': () => {rotationX += speed},
    'ArrowRight': () => {rotationX -= speed},
    'ArrowUp': () => {rotationY += speed},
    'ArrowDown': () => {rotationY -= speed},
    'Q': () => {scale -= speed * 0.01},
    'E': () => {scale += speed * 0.01},
    'q': () => {moveX -= speed * 0.1},
    'e': () => {moveX += speed * 0.1},
    '=': () => {lightIntensivity += speed * 0.5},
    '-': () => {lightIntensivity -= speed * 0.5},
    '+': () => {lightQuadratic += speed * 0.005;},
    '_': () => {lightQuadratic -= speed * 0.005;},
    '9': () => {lightLinear -= speed * 0.01;},
    '0': () => {lightLinear += speed * 0.01;},
    'a': () => {ambient -= speed * 0.01;},
    'd': () => {ambient += speed * 0.01;},
    'A': () => {diff -= speed * 0.01;},
    'D': () => {diff += speed * 0.01;},
    'z': () => {specular -= speed * 0.01;},
    'c': () => {specular += speed * 0.01;},
};

function input() {
    if (!keyPressed) return;
    let handler = inputHandlers[keyPressed];
    if (handler)
        handler();
}

function task() {
    console.log(`Shading ${isPhongShading ? 'Phong' : 'Gouraud'}, Model: ${lightModel ? 'Phong' : 'Lambert'}`);

    const shaderPhongLambert = utils.initShaderProgram(vertex.shaderPhong, frag.shaderLambert);
    const shaderPhongPhong = utils.initShaderProgram(vertex.shaderPhong, frag.shaderPhong);
    const shaderGouraudLambert = utils.initShaderProgram(vertex.shaderGouraudLambert, frag.shaderGouraud);
    const shaderGouraudPhong = utils.initShaderProgram(vertex.shaderGouraudPhong, frag.shaderGouraud);
    let shader: WebGLProgram;
    
    const verticesBuffer = utils.createFloatBuffer(snowmanOBJ.vertices, gl.ARRAY_BUFFER);
    const normalsBuffer = utils.createFloatBuffer(snowmanOBJ.normals, gl.ARRAY_BUFFER);
    const indicesBuffer = utils.createUint16Buffer(snowmanOBJ.indices, gl.ELEMENT_ARRAY_BUFFER);

    function render() {
        input();

        gl.clearColor(0.0, 0.0, 0.0, 1.0);
        gl.clearDepth(1.0);
        gl.enable(gl.DEPTH_TEST);
        gl.depthFunc(gl.LEQUAL);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        let viewProjection = mat4.create();
        mat4.perspective(viewProjection, 45, 1200.0 / 800.0, 0.1, 100.0);

        if (isPhongShading) {
            shader = lightModel ? shaderPhongPhong : shaderPhongLambert;
        }
        else {
            shader = lightModel ? shaderGouraudPhong : shaderGouraudLambert;
        }

        drawObject(shader, [0.0, 0.0, -6.0], viewProjection, {
            elementsCount: snowmanOBJ.indices.length,
            verticesBuffer: verticesBuffer,
            normalsBuffer: normalsBuffer,
            indicesBuffer: indicesBuffer
        });

        requestAnimationFrame(render);
    }
    render();
}

function main() {
    switch (taskId) {
        case 'Light':
            task();
            break;
    }
}

window.addEventListener('keydown', (event) => {
    keyPressed = event.key;
})
window.addEventListener('keyup', (event) => {
    switch(event.key) {
        case 'g':
            isPhongShading = !isPhongShading;
            console.log(`Shading ${isPhongShading ? 'Phong' : 'Gouraud'}, Model: ${lightModelNames[lightModel]}`);
            break;

        case 'l':
            lightModel++;
            if (lightModel > lightModelMax) lightModel = 0;
            console.log(`Shading ${isPhongShading ? 'Phong' : 'Gouraud'}, Model: ${lightModelNames[lightModel]}`);
            break;
    }

    keyPressed = undefined;
})

loadOBJs().then(result => {
    snowmanOBJ = utils.loadObj(result.snowman);
    
    //console.log(result.snowman);

    main();
});