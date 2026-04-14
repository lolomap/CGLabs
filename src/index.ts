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
let ambient = 0;
let diff = 1;
let specular = 0.5;
let tint = -1;
let textureMix = 0.5;
const speed = 1.0;

let keyPressed: string;

utils.setupGL();
const gl = utils.gl;

let cubeOBJ: utils.OBJ;
let sphereOBJ: utils.OBJ;
let pigeonOBJ: utils.OBJ;

const imageTexture1 = document.getElementById("texture1");
const imageTexture2 = document.getElementById("texture2"); 
const imageTexture3 = document.getElementById("texture3");
const imageTexturePigeon = document.getElementById("pigeon");
const imageTextureWood = document.getElementById("wood");
let texture1 = gl.createTexture(); waitLoadTexture(imageTexture1, texture1);
let texture2 = gl.createTexture(); waitLoadTexture(imageTexture2, texture2);
let texture3 = gl.createTexture(); waitLoadTexture(imageTexture3, texture3);
let texturePigeon = gl.createTexture(); waitLoadTexture(imageTexturePigeon, texturePigeon);
let textureWood = gl.createTexture(); waitLoadTexture(imageTextureWood, textureWood);
imageTexture1.onload = () => utils.handleTextureLoaded(imageTexture1, texture1);
imageTexture2.onload = () => utils.handleTextureLoaded(imageTexture2, texture2);
imageTexture3.onload = () => utils.handleTextureLoaded(imageTexture3, texture3);
imageTexturePigeon.onload = () => utils.handleTextureLoaded(imageTexturePigeon, texturePigeon);
imageTextureWood.onload = () => utils.handleTextureLoaded(imageTextureWood, textureWood);

function drawModel(
    vertexPosLoc: number,
    vertexNormalLoc: number,
    vertexUvLoc: number,
    renderObj: utils.RenderObj
) {
    gl.bindBuffer(gl.ARRAY_BUFFER, renderObj.verticesBuffer);
    gl.vertexAttribPointer(vertexPosLoc, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vertexPosLoc);

    gl.bindBuffer(gl.ARRAY_BUFFER, renderObj.normalsBuffer);
    gl.vertexAttribPointer(vertexNormalLoc, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vertexNormalLoc);

    gl.bindBuffer(gl.ARRAY_BUFFER, renderObj.uvsBuffer);
    gl.vertexAttribPointer(vertexUvLoc, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vertexUvLoc);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, renderObj.indicesBuffer);
    gl.drawElements(gl.TRIANGLES, renderObj.elementsCount, gl.UNSIGNED_SHORT, 0);
}

function drawObject(
    shader: WebGLShader,
    pos: ReadonlyVec3,
    viewProjection: mat4,
    renderObj: utils.RenderObj,
    scaleModifier,
    texture: WebGLTexture
) {
    gl.useProgram(shader);

    let vertexPosLoc = gl.getAttribLocation(shader, "inPosition");
    let vertexNormalLoc = gl.getAttribLocation(shader, "inNormal");
    let vertexUvLoc = gl.getAttribLocation(shader, 'inUV');

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

    let samplerLoc = gl.getUniformLocation(shader, 'sampler');
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.uniform1i(samplerLoc, 0);
    
    let sampler2Loc = gl.getUniformLocation(shader, 'sampler2');
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, textureWood);
    gl.uniform1i(sampler2Loc, 1);

    let textureMixLoc = gl.getUniformLocation(shader, 'textureMix');
    gl.uniform1f(textureMixLoc, textureMix)
    
    let tintLoc = gl.getUniformLocation(shader, 'tint');
    let tintColor = [0.3, 0.3, 0.3, 1.0];
    if (tint >= 0)
        tintColor[tint] = 1.0;
    else tintColor = [1.0, 1.0, 1.0, 1.0];
    gl.uniform4fv(tintLoc, tintColor);


    let model = mat4.create();
    mat4.translate(model, model, [pos[0] + moveX, pos[1], pos[2]]);
    mat4.rotate(model, model, rotationY * (Math.PI / 180), [1.0, 0.0, 0.0]);
    mat4.rotate(model, model, (rotationX - 90) * (Math.PI / 180), [0.0, 1.0, 0.0]);
    mat4.scale(model, model, [scale * scaleModifier, scale  * scaleModifier, scale  * scaleModifier]);
    gl.uniformMatrix4fv(modelLoc, false, model as Float32Array);
    drawModel(vertexPosLoc, vertexNormalLoc, vertexUvLoc, renderObj);
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
    '1': () => {textureMix -= speed * 0.01},
    '2': () => {textureMix += speed * 0.01},
};

function input() {
    if (!keyPressed) return;
    let handler = inputHandlers[keyPressed];
    if (handler)
        handler();
}

function task() {
    const shader = utils.initShaderProgram(vertex.shaderPhongTextured, frag.shaderPhongTextured);
    
    const cube_verticesBuffer = utils.createFloatBuffer(cubeOBJ.vertices, gl.ARRAY_BUFFER);
    const cube_normalsBuffer = utils.createFloatBuffer(cubeOBJ.normals, gl.ARRAY_BUFFER);
    const cube_uvsBuffer = utils.createFloatBuffer(cubeOBJ.uvs, gl.ARRAY_BUFFER);
    const cube_indicesBuffer = utils.createUint16Buffer(cubeOBJ.indices, gl.ELEMENT_ARRAY_BUFFER);

    const pigeon_verticesBuffer = utils.createFloatBuffer(pigeonOBJ.vertices, gl.ARRAY_BUFFER);
    const pigeon_normalsBuffer = utils.createFloatBuffer(pigeonOBJ.normals, gl.ARRAY_BUFFER);
    const pigeon_uvsBuffer = utils.createFloatBuffer(pigeonOBJ.uvs, gl.ARRAY_BUFFER);
    const pigeon_indicesBuffer = utils.createUint16Buffer(pigeonOBJ.indices, gl.ELEMENT_ARRAY_BUFFER);

    function render() {
        input();

        gl.clearColor(0.0, 0.0, 0.0, 1.0);
        gl.clearDepth(1.0);
        gl.enable(gl.DEPTH_TEST);
        gl.depthFunc(gl.LEQUAL);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        let viewProjection = mat4.create();
        mat4.perspective(viewProjection, 45, 1200.0 / 800.0, 0.1, 100.0);

        
        drawObject(shader, [0.0, 2.0, -6.0], viewProjection, {
            elementsCount: cubeOBJ.indices.length,
            verticesBuffer: cube_verticesBuffer,
            normalsBuffer: cube_normalsBuffer,
            uvsBuffer: cube_uvsBuffer,
            indicesBuffer: cube_indicesBuffer
        }, 1.0, texture1);

        drawObject(shader, [-1.5, -1.0, -6.0], viewProjection, {
            elementsCount: cubeOBJ.indices.length,
            verticesBuffer: cube_verticesBuffer,
            normalsBuffer: cube_normalsBuffer,
            uvsBuffer: cube_uvsBuffer,
            indicesBuffer: cube_indicesBuffer
        }, 1.0, texture2);

        drawObject(shader, [1.5, -1.0, -6.0], viewProjection, {
            elementsCount: cubeOBJ.indices.length,
            verticesBuffer: cube_verticesBuffer,
            normalsBuffer: cube_normalsBuffer,
            uvsBuffer: cube_uvsBuffer,
            indicesBuffer: cube_indicesBuffer
        }, 1.0, texture3);

        drawObject(shader, [4.0, -1.0, -6.0], viewProjection, {
            elementsCount: pigeonOBJ.indices.length,
            verticesBuffer: pigeon_verticesBuffer,
            normalsBuffer: pigeon_normalsBuffer,
            uvsBuffer: pigeon_uvsBuffer,
            indicesBuffer: pigeon_indicesBuffer
        }, 2.0, texturePigeon);

        requestAnimationFrame(render);
    }
    render();
}

function main() {
    switch (taskId) {
        case 'Textures':
            task();
            break;
    }
}

window.addEventListener('keydown', (event) => {
    keyPressed = event.key;
})
window.addEventListener('keyup', (event) => {
    if (event.key == '`') {
        tint++; if (tint > 2) tint = -1;
    }
    keyPressed = undefined;
})

loadOBJs().then(result => {
    cubeOBJ = utils.loadObj(result.cube);
    sphereOBJ = utils.loadObj(result.sphere);
    pigeonOBJ = utils.loadObj(result.pigeon);
    //console.log(result.snowman);
    main();
});

function waitLoadTexture(image, texture) {
    if (image.complete) {
    utils.handleTextureLoaded(image, texture);
} else {
    image.onload = () => utils.handleTextureLoaded(image, texture);
}
}