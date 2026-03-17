let canvas: HTMLCanvasElement;
export let gl: WebGL2RenderingContext;

export function setupGL() {
    const canvas : HTMLCanvasElement = document.getElementById("canvas") as HTMLCanvasElement;
    gl = canvas.getContext("webgl2")!;
}

export function handleShaderError(shader: WebGLShader) {
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {    
        console.warn('An error occurred compiling the vertex shader:\n' + gl.getShaderInfoLog(shader));    
        gl.deleteShader(shader);
    } 
}

export function initShaderProgram(vert: string, frag: string) : WebGLProgram {
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

    return shaderProgram
}

export function createFloatBuffer(data: Float32Array, type: GLenum) : WebGLBuffer {
    const buffer = gl.createBuffer();
    gl.bindBuffer(type, buffer);
    gl.bufferData(type, data, gl.STATIC_DRAW);
    return buffer;
}
export function createUint16Buffer(data: Uint16Array, type: GLenum) : WebGLBuffer {
    const buffer = gl.createBuffer();
    gl.bindBuffer(type, buffer);
    gl.bufferData(type, data, gl.STATIC_DRAW);
    return buffer;
}

export type OBJ = {
    vertices: Float32Array<ArrayBuffer>;
    normals: Float32Array<ArrayBuffer>;
    indices: Uint16Array<ArrayBuffer>;
}
export type RenderObj = {
    elementsCount: number,
    verticesBuffer: WebGLBuffer,
    normalsBuffer: WebGLBuffer,
    indicesBuffer: WebGLBuffer
}

export function loadObj(data: string): OBJ {

    const positions: number[][] = [];
    const normals: number[][] = [];

    const outPositions: number[] = [];
    const outNormals: number[] = [];
    const indices: number[] = [];

    const vertexMap = new Map<string, number>();

    const lines = data.split('\n');

    for (let line of lines) {

        const parts = line.trim().split(/\s+/);

        if (parts[0] === 'v') {

            positions.push([
                parseFloat(parts[1]),
                parseFloat(parts[2]),
                parseFloat(parts[3])
            ]);

        } else if (parts[0] === 'vn') {

            normals.push([
                parseFloat(parts[1]),
                parseFloat(parts[2]),
                parseFloat(parts[3])
            ]);

        } else if (parts[0] === 'f') {

            for (let i = 1; i <= 3; i++) {

                const key = parts[i];

                let vertexIndex = vertexMap.get(key);

                if (vertexIndex === undefined) {

                    const specs = key.split('/');

                    const posIdx = parseInt(specs[0]) - 1;
                    const normIdx = specs[2] ? parseInt(specs[2]) - 1 : -1;

                    const pos = positions[posIdx];
                    outPositions.push(pos[0], pos[1], pos[2]);

                    if (normIdx >= 0 && normals[normIdx]) {
                        const n = normals[normIdx];
                        outNormals.push(n[0], n[1], n[2]);
                    } else {
                        outNormals.push(0, 1, 0);
                    }

                    vertexIndex = outPositions.length / 3 - 1;
                    vertexMap.set(key, vertexIndex);
                }

                indices.push(vertexIndex);
            }
        }
    }

    return {
        vertices: new Float32Array(outPositions),
        normals: new Float32Array(outNormals),
        indices: new Uint16Array(indices)
    };
}