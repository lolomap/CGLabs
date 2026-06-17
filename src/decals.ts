import { vec3 } from 'gl-matrix';
import * as utils from './utils'

let gl;

export class DecalData {
    position: vec3;
    halfSize: vec3;
    normal: vec3;
    up: vec3;
}

export class DecalManager {
    MAX_DECALS = 255;
    BUFFER_SIZE = 16 + this.MAX_DECALS * 64;
    count = 0;

    bufferData = new ArrayBuffer(this.BUFFER_SIZE);
    floatBuffer = new Float32Array(this.bufferData);
    intBuffer = new Int32Array(this.bufferData);

    buffer: WebGLBuffer;
    writeIndex = 0;

    constructor(shader: WebGLProgram, maxDecals?: number) {
        if (maxDecals != undefined) {
            this.MAX_DECALS = maxDecals;
        }
        gl = utils.gl;

        this.buffer = gl.createBuffer();
        gl.bindBuffer(gl.UNIFORM_BUFFER, this.buffer);
        gl.bufferData(gl.UNIFORM_BUFFER, this.BUFFER_SIZE, gl.DYNAMIC_DRAW);

        let UBOloc = gl.getUniformBlockIndex(shader, 'DecalsData');
        gl.uniformBlockBinding(shader, UBOloc, 0);
        gl.bindBufferBase(gl.UNIFORM_BUFFER, 0, this.buffer);

        this.updateCount();
    }

    updateCount() {
        this.intBuffer[0] = this.count;
        gl.bindBuffer(gl.UNIFORM_BUFFER, this.buffer);
        gl.bufferSubData(gl.UNIFORM_BUFFER, 0, this.intBuffer, 0, 4);
    }

    addDecal(decalData: DecalData) {
        const offset = 4 + this.writeIndex * 16;

        this.floatBuffer[offset + 0] = decalData.position[0];
        this.floatBuffer[offset + 1] = decalData.position[1];
        this.floatBuffer[offset + 2] = decalData.position[2];
        this.floatBuffer[offset + 3] = 0.0;

        this.floatBuffer[offset + 4] = decalData.halfSize[0];
        this.floatBuffer[offset + 5] = decalData.halfSize[1];
        this.floatBuffer[offset + 6] = decalData.halfSize[2];
        this.floatBuffer[offset + 7] = 0.0;
        
        this.floatBuffer[offset + 8] = decalData.normal[0];
        this.floatBuffer[offset + 9] = decalData.normal[1];
        this.floatBuffer[offset + 10] = decalData.normal[2];
        this.floatBuffer[offset + 11] = 0.0;
        
        this.floatBuffer[offset + 12] = decalData.up[0];
        this.floatBuffer[offset + 13] = decalData.up[1];
        this.floatBuffer[offset + 14] = decalData.up[2];
        this.floatBuffer[offset + 15] = 0.0;

        gl.bindBuffer(gl.UNIFORM_BUFFER, this.buffer);
        gl.bufferSubData(gl.UNIFORM_BUFFER, 16 + this.writeIndex * 64, this.floatBuffer, offset, 16);

        this.writeIndex = (this.writeIndex + 1) % this.MAX_DECALS;

        if (this.count < this.MAX_DECALS) {
            this.count++;
            this.updateCount();
        }
    }
}