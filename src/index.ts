import * as vertex from './vert'
import * as frag from './frag'
import * as utils from './utils'
import {mat4, vec3, ReadonlyVec3, IndexedCollection} from 'gl-matrix'
import { loadOBJs } from './files';

const taskId = document.title;

let lightIntensivity = 5.0;
let lightLinear = 0.09;
let lightQuadratic = 0.032;
let ambient = 0.5;
let diff = 1;
let specular = 0.15;
let tint = -1;
let textureMix = 0.5;
let bumpScale = 1;
const speed = 1.0;

let keyPressed: string;

let cameraPos: vec3 = [0.0, 0.0, 5.0];
let cameraYaw = -90.0;
let cameraPitch = 0.0;
let cameraFront: vec3 = [0.0, 0.0, -1.0];
let cameraUp: vec3 = [0.0, 1.0, 0.0];
let cameraSpeed = 0.1;

utils.setupGL();
const gl = utils.gl;

let cubeOBJ: utils.OBJ;
let sphereOBJ: utils.OBJ;
let humanOBJ: utils.OBJ;

// const emptyNormalImageTexture = document.getElementById("empty_normal");
// let emptyNormalTexture = gl.createTexture(); waitLoadTexture(emptyNormalImageTexture, emptyNormalTexture);
// emptyNormalImageTexture.onload = () => utils.handleTextureLoaded(emptyNormalImageTexture, emptyNormalTexture);

const emptyNormalTexture = loadTexture("empty_normal");
const woodTexture = loadTexture("wood");


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
    scaleModifier: IndexedCollection,
    texture: WebGLTexture,
    map: WebGLTexture,
    textureRepeat: number
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

    if (texture) {
        let samplerLoc = gl.getUniformLocation(shader, 'sampler');
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.uniform1i(samplerLoc, 0);
    }
    if (map) {
        let mapLoc = gl.getUniformLocation(shader, 'map');
        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, map);
        gl.uniform1i(mapLoc, 1);
    }
    
    let tintLoc = gl.getUniformLocation(shader, 'tint');
    let tintColor = [1.0, 1.0, 1.0, 1.0];
    gl.uniform4fv(tintLoc, tintColor);

    let repeatLoc = gl.getUniformLocation(shader, 'repeatScale');
    gl.uniform1f(repeatLoc, textureRepeat);

    let model = mat4.create();
    mat4.translate(model, model, [pos[0], pos[1], pos[2]]);
    mat4.rotate(model, model, -90 * (Math.PI / 180), [0.0, 1.0, 0.0]);
    mat4.scale(model, model, scaleModifier);
    gl.uniformMatrix4fv(modelLoc, false, model as Float32Array);
    drawModel(vertexPosLoc, vertexNormalLoc, vertexUvLoc, renderObj);
}

const inputHandlers = {
    'w': () => {
        let movement = vec3.scale(vec3.create(), cameraFront, cameraSpeed);
        vec3.add(cameraPos, cameraPos, movement);
    },
    's': () => {
        let movement = vec3.scale(vec3.create(), cameraFront, cameraSpeed);
        vec3.sub(cameraPos, cameraPos, movement);
    },
    'a': () => {
        let cameraRight = vec3.cross(vec3.create(), cameraFront, cameraUp);
        vec3.normalize(cameraRight, cameraRight);
        let movement = vec3.scale(vec3.create(), cameraRight, cameraSpeed);
        vec3.sub(cameraPos, cameraPos, movement);
    },
    'd': () => {
        let cameraRight = vec3.cross(vec3.create(), cameraFront, cameraUp);
        vec3.normalize(cameraRight, cameraRight);
        let movement = vec3.scale(vec3.create(), cameraRight, cameraSpeed);
        vec3.add(cameraPos, cameraPos, movement);
    },
    'q': () => {cameraPos[1] -= speed * 0.1},
    'e': () => {cameraPos[1] += speed * 0.1},
    '=': () => {lightIntensivity += speed * 0.5},
    '-': () => {lightIntensivity -= speed * 0.5},
    '+': () => {lightQuadratic += speed * 0.005;},
    '_': () => {lightQuadratic -= speed * 0.005;},
    '9': () => {lightLinear -= speed * 0.01;},
    '0': () => {lightLinear += speed * 0.01;},
    'k': () => {ambient -= speed * 0.01;},
    'l': () => {ambient += speed * 0.01;},
    'K': () => {diff -= speed * 0.01;},
    'L': () => {diff += speed * 0.01;},
    'z': () => {specular -= speed * 0.01;},
    'c': () => {specular += speed * 0.01;},
    '1': () => {textureMix -= speed * 0.01},
    '2': () => {textureMix += speed * 0.01},
    'b': () => {bumpScale += speed * 0.01},
    'B': () => {bumpScale -= speed * 0.01}
};

function input() {
    if (!keyPressed) return;
    let handler = inputHandlers[keyPressed];
    if (handler)
        handler();
}

function task() {
    const litShader = utils.initShaderProgram(vertex.shaderPhongBumping, frag.shaderPhongNormal);

    const HUMAN = {
        model: {
            elementsCount: humanOBJ.indices.length,
            verticesBuffer: utils.createFloatBuffer(humanOBJ.vertices, gl.ARRAY_BUFFER),
            normalsBuffer: utils.createFloatBuffer(humanOBJ.normals, gl.ARRAY_BUFFER),
            uvsBuffer: utils.createFloatBuffer(humanOBJ.uvs, gl.ARRAY_BUFFER),
            indicesBuffer: utils.createUint16Buffer(humanOBJ.indices, gl.ELEMENT_ARRAY_BUFFER)
        },
        pos: [0.0, 0.0, -6.0],
        scale: [1, 1, 1],
        texture: undefined,
        repeat: 1
    };

    const WHALL = {
        model: {
            elementsCount: cubeOBJ.indices.length,
            verticesBuffer: utils.createFloatBuffer(cubeOBJ.vertices, gl.ARRAY_BUFFER),
            normalsBuffer: utils.createFloatBuffer(cubeOBJ.normals, gl.ARRAY_BUFFER),
            uvsBuffer: utils.createFloatBuffer(cubeOBJ.uvs, gl.ARRAY_BUFFER),
            indicesBuffer: utils.createUint16Buffer(cubeOBJ.indices, gl.ELEMENT_ARRAY_BUFFER)
        },
        pos: [0.0, 0.0, -6.0],
        scale: [1, 1, 1],
        texture: woodTexture,
        repeat: 1
    }

    const SCENE = [
        {...WHALL, pos: [0.0, -2, 0.0], scale: [20, 0.1, 20], repeat: 24},

        {...HUMAN, pos: [-3.5, -2.0, -6.0]},
        {...HUMAN, pos: [2.5, -2.0, -6.0]}
    ];

    function render() {
        input();

        gl.clearColor(0.0, 0.0, 0.0, 1.0);
        gl.clearDepth(1.0);
        gl.enable(gl.DEPTH_TEST);
        gl.depthFunc(gl.LEQUAL);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        let view = mat4.create();
        let target = vec3.create();
        vec3.add(target, cameraPos, cameraFront);
        mat4.lookAt(view, cameraPos, target, cameraUp);

        let projection = mat4.create();
        mat4.perspective(projection, 45, 1200.0 / 800.0, 0.1, 100.0);

        let viewProjection = mat4.create();
        mat4.multiply(viewProjection, projection, view);
        
        SCENE.forEach(obj => {
            drawObject(litShader, obj.pos, viewProjection,
                obj.model, obj.scale, obj.texture, emptyNormalTexture, obj.repeat);
        })

        requestAnimationFrame(render);
    }
    render();
}

function main() {
    switch (taskId) {
        case 'Exam':
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

document.addEventListener('mousemove', (event) => {
    if (document.pointerLockElement === document.body) {
        cameraYaw += event.movementX * 0.1;
        cameraPitch -= event.movementY * 0.1;
        if (cameraPitch > 89.0) cameraPitch = 89.0;
        if (cameraPitch < -89.0) cameraPitch = -89.0;
        
        let yawRad = cameraYaw * Math.PI / 180.0;
        let pitchRad = cameraPitch * Math.PI / 180.0;
        cameraFront[0] = Math.cos(yawRad) * Math.cos(pitchRad);
        cameraFront[1] = Math.sin(pitchRad);
        cameraFront[2] = Math.sin(yawRad) * Math.cos(pitchRad);
        vec3.normalize(cameraFront, cameraFront);
    }
});

document.addEventListener('click', () => {
    document.body.requestPointerLock();
});

loadOBJs().then(result => {
    cubeOBJ = utils.loadObj(result.cube);
    sphereOBJ = utils.loadObj(result.sphere);
    humanOBJ = utils.loadObj(result.human);
    
    main();
});

function loadTexture(image: string) {
    const imageTexture = document.getElementById(image);
    let texture = gl.createTexture(); waitLoadTexture(imageTexture, texture);
    imageTexture.onload = () => utils.handleTextureLoaded(imageTexture, texture);

    return texture;
}

function waitLoadTexture(image, texture) {
    if (image.complete) {
        utils.handleTextureLoaded(image, texture);
    } else {
        image.onload = () => utils.handleTextureLoaded(image, texture);
    }
}