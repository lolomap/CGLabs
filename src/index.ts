import * as vertex from './vert'
import * as frag from './frag'
import * as utils from './utils'
import {mat4, ReadonlyVec3} from 'gl-matrix'
import { Emitter } from './emitter'
import { Spark } from './spark';
import { Smoke } from './smoke'

const taskId = document.title;

let lastTime = 0;

let rotationX = 0.0;
let rotationY = 0.0;
let scale = 0.75;
let moveX = 0.0; 
const speed = 1.0;

let keyPressed: string;

utils.setupGL();
const gl = utils.gl;

const sparkleImageTexture = document.getElementById("sparkle");
let sparkleTexture = gl.createTexture(); waitLoadTexture(sparkleImageTexture, sparkleTexture);
sparkleImageTexture.onload = () => utils.handleTextureLoaded(sparkleImageTexture, sparkleTexture);

const smokeImageTexture = document.getElementById("smoke");
let smokeTexture = gl.createTexture(); waitLoadTexture(smokeImageTexture, smokeTexture);
smokeImageTexture.onload = () => utils.handleTextureLoaded(smokeImageTexture, smokeTexture);

function drawPoints(
    vertexPosLoc: number,
    vertexColorLoc: number,
    vertexScaleLoc: number,
    vertices: WebGLBuffer,
    count: number,
    mode: GLenum
) {
    gl.bindBuffer(gl.ARRAY_BUFFER, vertices);
    gl.vertexAttribPointer(vertexPosLoc, 3, gl.FLOAT, false, 32, 0);
    gl.vertexAttribPointer(vertexColorLoc, 4, gl.FLOAT, false, 32, 12);
    gl.vertexAttribPointer(vertexScaleLoc, 1, gl.FLOAT, false, 32, 28);
    gl.enableVertexAttribArray(vertexPosLoc);
    gl.enableVertexAttribArray(vertexColorLoc);
    gl.enableVertexAttribArray(vertexScaleLoc);

    gl.drawArrays(mode, 0, count);
}

function drawParticles(
    shader: WebGLShader,
    pos: ReadonlyVec3,
    vertices: WebGLBuffer,
    count: number,
    viewProjection: mat4,
    texture: WebGLTexture,
    mode: GLenum
) {
    gl.useProgram(shader);

    let vertexPosLoc = gl.getAttribLocation(shader, "inPosition");
    let vertexColorLoc = gl.getAttribLocation(shader, 'inColor');
    let vertexScaleLoc = gl.getAttribLocation(shader, 'inScale');

    let viewProjectionLoc = gl.getUniformLocation(shader, "viewProjection");
    let modelLoc = gl.getUniformLocation(shader, "model");
    gl.uniformMatrix4fv(viewProjectionLoc, false, viewProjection as Float32Array);

    if (texture) {
        let samplerLoc = gl.getUniformLocation(shader, 'sampler');
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.uniform1i(samplerLoc, 0);
    }

    let model = mat4.create();
    mat4.translate(model, model, [pos[0] + moveX, pos[1], pos[2]]);
    mat4.rotate(model, model, rotationY * (Math.PI / 180), [1.0, 0.0, 0.0]);
    mat4.rotate(model, model, (rotationX) * (Math.PI / 180), [0.0, 1.0, 0.0]);
    gl.uniformMatrix4fv(modelLoc, false, model as Float32Array);

    switch (mode) {
        case gl.POINTS:
            drawPoints(vertexPosLoc, vertexColorLoc, vertexScaleLoc, vertices, count, gl.POINTS);
            break;
        case gl.LINES:
            drawPoints(vertexPosLoc, vertexColorLoc, vertexScaleLoc, vertices, count, gl.LINES);
            break;
    }
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
    const sparklerTrailShader = utils.initShaderProgram(vertex.shaderSparklerTrail, frag.shaderSparklerTrail);
    
    const sparkler_verticesBuffer = gl.createBuffer();
    const sparklerEmitter = new Emitter(Spark);
    sparklerEmitter.spawn(10, 5, 10, 125, 256);

    function render() {
        input();
        let time = performance.now();
        let deltaTime = (time - lastTime) / 1000;
        lastTime = time;

        gl.clearColor(0.0, 0.0, 0.0, 1.0);
        gl.clearDepth(1.0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        let viewProjection = mat4.create();
        mat4.perspective(viewProjection, 45, 1200.0 / 800.0, 0.1, 100.0);

        sparklerEmitter.process(time, deltaTime);
        sparklerEmitter.apply(sparkler_verticesBuffer);
        drawParticles(sparklerShader, [0.0, 0.0, -30.0], sparkler_verticesBuffer, sparklerEmitter.particles.length,
            viewProjection, sparkleTexture, gl.POINTS);
        
        const trailsVertices = [];
        sparklerEmitter.particles.forEach(particle => {
            trailsVertices.push(0, 0, 0); //start pos
            trailsVertices.push(1, 1, 1, 1); //start color
            trailsVertices.push(1);

            trailsVertices.push(particle.x, particle.y, 0); //end pos
            trailsVertices.push(0.47, 0.31, 0.24, 1) //end color
            trailsVertices.push(1);
        })
        const spartklerTrails_verticesBuffer = utils.createFloatBuffer(new Float32Array(trailsVertices), gl.ARRAY_BUFFER);
        drawParticles(sparklerTrailShader, [0.0, 0.0, -30.0], spartklerTrails_verticesBuffer,
            sparklerEmitter.particles.length * 2, viewProjection, undefined, gl.LINES);

        requestAnimationFrame(render);
    }
    render();
}

function smoke() {
    const smokeShader = utils.initShaderProgram(vertex.shaderSmoke, frag.shaderSmoke);
    const sparklerTrailShader = utils.initShaderProgram(vertex.shaderSparklerTrail, frag.shaderSparklerTrail);

    const smoke_verticesBuffer = gl.createBuffer();
    const smokeEmitter = new Emitter(Smoke);
    smokeEmitter.spawn(100, 2000, 4000, 1, 2);

     function render() {
        input();
        let time = performance.now();
        let deltaTime = (time - lastTime) / 1000;
        lastTime = time;

        gl.clearColor(0.0, 0.0, 0.0, 1.0);
        gl.clearDepth(1.0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        let viewProjection = mat4.create();
        mat4.perspective(viewProjection, 45, 1200.0 / 800.0, 0.1, 100.0);

        smokeEmitter.process(time, deltaTime);
        smokeEmitter.apply(smoke_verticesBuffer);
        drawParticles(smokeShader, [0.0, 0.0, -30.0], smoke_verticesBuffer, smokeEmitter.particles.length,
            viewProjection, smokeTexture, gl.POINTS);

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
        case 'Smoke':
            smoke();
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