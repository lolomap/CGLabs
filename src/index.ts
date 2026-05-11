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
const speed = 1.0;

let keyPressed: string;

utils.setupGL();
const gl = utils.gl;

const sparkleImageTexture = document.getElementById("sparkle");
let orangeTexture = gl.createTexture(); waitLoadTexture(sparkleImageTexture, orangeTexture);
sparkleImageTexture.onload = () => utils.handleTextureLoaded(sparkleImageTexture, orangeTexture);

function drawPoints(
    vertexPosLoc: number,
    vertices: WebGLBuffer,
    count: number
) {
    gl.bindBuffer(gl.ARRAY_BUFFER, vertices);
    gl.vertexAttribPointer(vertexPosLoc, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vertexPosLoc);

    gl.drawArrays(gl.POINTS, 0, count);
}

function drawParticles(
    shader: WebGLShader,
    pos: ReadonlyVec3,
    vertices: WebGLBuffer,
    count: number,
    viewProjection: mat4,
    texture: WebGLTexture,
) {
    gl.useProgram(shader);

    let vertexPosLoc = gl.getAttribLocation(shader, "inPosition");

    let viewProjectionLoc = gl.getUniformLocation(shader, "viewProjection");
    let modelLoc = gl.getUniformLocation(shader, "model");
    gl.uniformMatrix4fv(viewProjectionLoc, false, viewProjection as Float32Array);

    let samplerLoc = gl.getUniformLocation(shader, 'sampler');
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.uniform1i(samplerLoc, 0);


    let model = mat4.create();
    mat4.translate(model, model, [pos[0] + moveX, pos[1], pos[2]]);
    mat4.rotate(model, model, rotationY * (Math.PI / 180), [1.0, 0.0, 0.0]);
    mat4.rotate(model, model, (rotationX) * (Math.PI / 180), [0.0, 1.0, 0.0]);
    gl.uniformMatrix4fv(modelLoc, false, model as Float32Array);
    drawPoints(vertexPosLoc, vertices, count);
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
};

function input() {
    if (!keyPressed) return;
    let handler = inputHandlers[keyPressed];
    if (handler)
        handler();
}

function sparkler() {
    const sparklerShader = utils.initShaderProgram(vertex.shaderSparkler, frag.shaderSparkler);
    
    const sparkler_verticesBuffer = utils.createFloatBuffer(new Float32Array([10, 0, 0, -10, 0, 0]), gl.ARRAY_BUFFER);


    function render() {
        input();

        gl.clearColor(0.0, 0.0, 0.0, 1.0);
        gl.clearDepth(1.0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        let viewProjection = mat4.create();
        mat4.perspective(viewProjection, 45, 1200.0 / 800.0, 0.1, 100.0);

        
        drawParticles(sparklerShader, [0.0, 0.0, -30.0], sparkler_verticesBuffer, 2, viewProjection, orangeTexture);

        requestAnimationFrame(render);
    }
    render();
}

function main() {
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE);

    switch (taskId) {
        case 'Sparkler':
            sparkler();
            break;
    }
}
main();

window.addEventListener('keydown', (event) => {
    keyPressed = event.key;
})
window.addEventListener('keyup', (event) => {
    keyPressed = undefined;
})

function waitLoadTexture(image, texture) {
    if (image.complete) {
    utils.handleTextureLoaded(image, texture);
} else {
    image.onload = () => utils.handleTextureLoaded(image, texture);
}
}