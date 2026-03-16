import * as vertex from './vert'
import * as frag from './frag'
import {mat4} from 'gl-matrix'

const taskId = document.title;

const canvas : HTMLCanvasElement = document.getElementById("canvas") as HTMLCanvasElement;
const gl : WebGL2RenderingContext = canvas.getContext("webgl2")!;

let rotationX = 0.0;
let rotationY = 0.0;
let scale = 0.75;
let moveX = 0; 
const speed = 1.0;

let keyPressed: string;

const cubeVertices = [
    -1.0, -1.0,  1.0,
     1.0, -1.0,  1.0,
     1.0,  1.0,  1.0,
    -1.0,  1.0,  1.0,
    -1.0, -1.0, -1.0,
     1.0, -1.0, -1.0,
     1.0,  1.0, -1.0,
    -1.0,  1.0, -1.0 
];

const cubeIndices = [
    // Front
    0, 1, 2,
    0, 2, 3,
    // Right
    1, 5, 6,
    1, 6, 2,
    // Back
    5, 4, 7,
    5, 7, 6,
    // Left
    4, 0, 3,
    4, 3, 7,
    // Top
    3, 2, 6,
    3, 6, 7,
    // Bottom
    4, 5, 1,
    4, 1, 0
];

let vertexPosLoc: number;
let vertexColorLoc: number;

function handleShaderError(shader: WebGLShader) {
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {    
        console.warn('An error occurred compiling the vertex shader:\n' + gl.getShaderInfoLog(shader));    
        gl.deleteShader(shader);
    } 
}

function initShaderProgram(vert: string, frag: string) : WebGLProgram {
    const vertShader = gl.createShader(gl.VERTEX_SHADER);
    const fragShader = gl.createShader(gl.FRAGMENT_SHADER);

    gl.shaderSource(vertShader, vert);
    gl.shaderSource(fragShader, frag);

    gl.compileShader(vertShader);
    handleShaderError(vertShader);
    
    gl.compileShader(fragShader);
    handleShaderError(fragShader);

    const shaderProgram = gl.createProgram();
    gl.attachShader(shaderProgram, vertShader);
    gl.attachShader(shaderProgram, fragShader);

    gl.linkProgram(shaderProgram);
    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {    
        console.warn('Unable to initialize the shader program:\n' + gl.getProgramInfoLog(shaderProgram));
    }
    
    vertexPosLoc = gl.getAttribLocation(shaderProgram, 'inPosition');
    vertexColorLoc = gl.getAttribLocation(shaderProgram, 'inColor');

    return shaderProgram
}

function createFloatBuffer(data: Float32Array, type: GLenum) : WebGLBuffer {
    const buffer = gl.createBuffer();
    gl.bindBuffer(type, buffer);
    gl.bufferData(type, data, gl.STATIC_DRAW);
    return buffer;
}
function createUint16Buffer(data: Uint16Array, type: GLenum) : WebGLBuffer {
    const buffer = gl.createBuffer();
    gl.bindBuffer(type, buffer);
    gl.bufferData(type, data, gl.STATIC_DRAW);
    return buffer;
}

function drawCube(vertices: WebGLBuffer, indices: WebGLBuffer, colors: WebGLBuffer) {
    gl.bindBuffer(gl.ARRAY_BUFFER, vertices);
    gl.vertexAttribPointer(vertexPosLoc, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vertexPosLoc);

    gl.bindBuffer(gl.ARRAY_BUFFER, colors);
    gl.vertexAttribPointer(vertexColorLoc, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vertexColorLoc);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indices);
    gl.drawElements(gl.TRIANGLES, 36, gl.UNSIGNED_SHORT, 0);
}

function input() {
    if (!keyPressed) return;

    switch (keyPressed) {
        case 'ArrowLeft':
            rotationX += speed;
            break;

        case 'ArrowRight':
            rotationX -= speed;
            break;

        case 'ArrowUp':
            rotationY += speed;
            break;

        case 'ArrowDown':
            rotationY -= speed;
            break;

        case 'Q':
            scale += speed * 0.01;
            break;

        case 'E':
            scale -= speed * 0.01;
            if (scale < 0) scale = 0;
            break;

        case 'q':
            moveX += speed * 0.1;
            break;

        case 'e':
            moveX -= speed * 0.1;
            break;

        default:
            break;
    }
}

function taskPatterns() {
    const shaderHorizontal = initShaderProgram(vertex.shader, frag.shaderStripsHorizontal);
    const shaderDiagonal = initShaderProgram(vertex.shader, frag.shaderStripsDiagonal);
    const shaderSquares = initShaderProgram(vertex.shader, frag.shaderSquares);
    
    const verticesBuffer = createFloatBuffer(new Float32Array(cubeVertices), gl.ARRAY_BUFFER);
    const indicesBuffer = createUint16Buffer(new Uint16Array(cubeIndices), gl.ELEMENT_ARRAY_BUFFER);

    const colorSize = cubeVertices.length / 3 * 4;
    let colors = new Array(colorSize);
    for(let i = 0; i < colorSize; i++) {colors[i] = 1.0};
    const colorsBuffer = createFloatBuffer(new Float32Array(colors), gl.ARRAY_BUFFER);

    function render() {
        input();

        gl.clearColor(0.0, 0.0, 0.0, 1.0);
        gl.clearDepth(1.0);
        gl.enable(gl.DEPTH_TEST);
        gl.depthFunc(gl.LEQUAL);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        let viewProjection = mat4.create();
        mat4.perspective(viewProjection, 45, 1200.0 / 800.0, 0.1, 100.0);
        
        ///
        gl.useProgram(shaderHorizontal);

        let viewProjectionLoc = gl.getUniformLocation(shaderHorizontal, "viewProjection");
        let modelLoc = gl.getUniformLocation(shaderHorizontal, "model");
        gl.uniformMatrix4fv(viewProjectionLoc, false, viewProjection as Float32Array);

        let model = mat4.create();
        mat4.translate(model, model, [-3.0 + moveX, 0.0, -6.0]);
        mat4.rotate(model, model, rotationY * (Math.PI / 180), [1.0, 0.0, 0.0]);
        mat4.rotate(model, model, rotationX * (Math.PI / 180), [0.0, 1.0, 0.0]);
        mat4.scale(model, model, [scale, scale, scale]);
        gl.uniformMatrix4fv(modelLoc, false, model as Float32Array);
        drawCube(verticesBuffer, indicesBuffer, colorsBuffer);

        ///
        gl.useProgram(shaderDiagonal);

        viewProjectionLoc = gl.getUniformLocation(shaderDiagonal, "viewProjection");
        modelLoc = gl.getUniformLocation(shaderDiagonal, "model");
        gl.uniformMatrix4fv(viewProjectionLoc, false, viewProjection as Float32Array);

        model = mat4.create();
        mat4.translate(model, model, [0.0 + moveX, 0.0, -6.0]);
        mat4.rotate(model, model, rotationY * (Math.PI / 180), [1.0, 0.0, 0.0]);
        mat4.rotate(model, model, rotationX * (Math.PI / 180), [0.0, 1.0, 0.0]);
        mat4.scale(model, model, [scale, scale, scale]);
        gl.uniformMatrix4fv(modelLoc, false, model as Float32Array);
        drawCube(verticesBuffer, indicesBuffer, colorsBuffer);

        ///
        gl.useProgram(shaderSquares);

        viewProjectionLoc = gl.getUniformLocation(shaderSquares, "viewProjection");
        modelLoc = gl.getUniformLocation(shaderSquares, "model");
        gl.uniformMatrix4fv(viewProjectionLoc, false, viewProjection as Float32Array);

        model = mat4.create();
        mat4.translate(model, model, [3.0 + moveX, 0.0, -6.0]);
        mat4.rotate(model, model, rotationY * (Math.PI / 180), [1.0, 0.0, 0.0]);
        mat4.rotate(model, model, rotationX * (Math.PI / 180), [0.0, 1.0, 0.0]);
        mat4.scale(model, model, [scale, scale, scale]);
        gl.uniformMatrix4fv(modelLoc, false, model as Float32Array);
        drawCube(verticesBuffer, indicesBuffer, colorsBuffer);

        requestAnimationFrame(render);
    }
    render();
}

function taskColors() {
    const shaderColors = initShaderProgram(vertex.shader, frag.shaderColors);

    const verticesBuffer = createFloatBuffer(new Float32Array(cubeVertices), gl.ARRAY_BUFFER);
    const indicesBuffer = createUint16Buffer(new Uint16Array(cubeIndices), gl.ELEMENT_ARRAY_BUFFER);

    let colors = [
        1.0, 0.0, 0.0, 1.0,
        0.0, 1.0, 0.0, 1.0,
        0.0, 0.0, 1.0, 1.0,
        0.0, 0.0, 0.0, 1.0,
        1.0, 1.0, 1.0, 1.0,
        0.5, 0.5, 0.5, 1.0,
    ];
    const colorsBuffer = createFloatBuffer(new Float32Array(colors), gl.ARRAY_BUFFER);

    function render() {
        input();

        gl.clearColor(0.0, 0.0, 0.0, 1.0);
        gl.clearDepth(1.0);
        gl.enable(gl.DEPTH_TEST);
        gl.depthFunc(gl.LEQUAL);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        let viewProjection = mat4.create();
        mat4.perspective(viewProjection, 45, 1200.0 / 800.0, 0.1, 100.0);
        
        ///
        gl.useProgram(shaderColors);

        let viewProjectionLoc = gl.getUniformLocation(shaderColors, "viewProjection");
        let modelLoc = gl.getUniformLocation(shaderColors, "model");
        gl.uniformMatrix4fv(viewProjectionLoc, false, viewProjection as Float32Array);

        let model = mat4.create();
        mat4.translate(model, model, [moveX, 0.0, -6.0]);
        mat4.rotate(model, model, rotationY * (Math.PI / 180), [1.0, 0.0, 0.0]);
        mat4.rotate(model, model, rotationX * (Math.PI / 180), [0.0, 1.0, 0.0]);
        mat4.scale(model, model, [scale, scale, scale]);
        gl.uniformMatrix4fv(modelLoc, false, model as Float32Array);
        drawCube(verticesBuffer, indicesBuffer, colorsBuffer);

        requestAnimationFrame(render);
    }
    render();
}

function main() {
    switch (taskId) {
        case 'Patterns':
            taskPatterns();
            break;
        case 'Colors':
            taskColors();
            break;
    }
}

window.addEventListener('keydown', (event) => {
    keyPressed = event.key;
})
window.addEventListener('keyup', (event) => {
    keyPressed = undefined;
})

main();