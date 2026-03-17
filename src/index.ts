import * as vertex from './vert'
import * as frag from './frag'
import * as utils from './utils'
import {mat4, ReadonlyVec3} from 'gl-matrix'
import { loadOBJs } from './files';

const taskId = document.title;

let rotationX = 0.0;
let rotationY = 0.0;
let scale = 0.75;
let moveX = 0; 
const speed = 1.0;

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
    gl.uniform3fv(lightPosLoc, [0.0, 5.0, 2.0]);
    gl.uniform3fv(lightColorLoc, [1.0, 1.0, 1.0]);

    let model = mat4.create();
    mat4.translate(model, model, [pos[0] + moveX, pos[1], pos[2]]);
    mat4.rotate(model, model, rotationY * (Math.PI / 180), [1.0, 0.0, 0.0]);
    mat4.rotate(model, model, rotationX * (Math.PI / 180), [0.0, 1.0, 0.0]);
    mat4.scale(model, model, [scale, scale, scale]);
    gl.uniformMatrix4fv(modelLoc, false, model as Float32Array);
    drawModel(vertexPosLoc, vertexNormalLoc, renderObj);
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

function task() {
    const shaderPhong = utils.initShaderProgram(vertex.shaderPhong, frag.shaderLambert);
    
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


        
        drawObject(shaderPhong, [0.0, 0.0, -6.0], viewProjection, {
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
    keyPressed = undefined;
})

loadOBJs().then(result => {
    snowmanOBJ = utils.loadObj(result.snowman);
    
    //console.log(result.snowman);

    main();
});