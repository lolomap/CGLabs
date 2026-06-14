let canvas: HTMLCanvasElement;
export let gl: WebGL2RenderingContext;

export function setupGL() {
    const canvas : HTMLCanvasElement = document.getElementById("canvas") as HTMLCanvasElement;
    gl = canvas.getContext("webgl2")!;
}

export function handleShaderError(shader: WebGLShader) {
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {    
        console.warn('An error occurred compiling the shader:\n' + gl.getShaderInfoLog(shader));    
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
    uvs: Float32Array<ArrayBuffer>;
    indices: Uint16Array<ArrayBuffer>;
}
export type RenderObj = {
    elementsCount: number,
    verticesBuffer: WebGLBuffer,
    normalsBuffer: WebGLBuffer,
    uvsBuffer: WebGLBuffer,
    indicesBuffer: WebGLBuffer
}

export function loadObj(data: string): OBJ {

    const positions: number[][] = [];
    const normals: number[][] = [];
    const uvs: number[][] = [];

    const outPositions: number[] = [];
    const outNormals: number[] = [];
    const outUVs: number[] = [];
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

        } else if (parts[0] === 'vt') {
            uvs.push([
                parseFloat(parts[1]),
                parseFloat(parts[2])
            ]);

        } else if (parts[0] === 'f') {

            for (let i = 1; i <= 3; i++) {

                const key = parts[i];

                let vertexIndex = vertexMap.get(key);

                if (vertexIndex === undefined) {

                    const specs = key.split('/');

                    const posIdx = parseInt(specs[0]) - 1;
                    const uvIdx = specs[1] ? parseInt(specs[1]) - 1 : -1;
                    const normIdx = specs[2] ? parseInt(specs[2]) - 1 : -1;

                    const pos = positions[posIdx];
                    outPositions.push(pos[0], pos[1], pos[2]);

                    if (normIdx >= 0 && normals[normIdx]) {
                        const n = normals[normIdx];
                        outNormals.push(n[0], n[1], n[2]);
                    } else {
                        outNormals.push(0, 1, 0);
                    }

                    if (uvIdx >= 0 && uvs[uvIdx]) {
                        const uv = uvs[uvIdx];
                        outUVs.push(uv[0], uv[1]);
                    } else {
                        outUVs.push(0, 0); // fallback
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
        uvs: new Float32Array(outUVs),
        indices: new Uint16Array(indices)
    };
}

export function handleTexturePlaceholder(texture) {
    gl.bindTexture(gl.TEXTURE_2D, texture);
    const pixel = new Uint8Array([0, 0, 255, 255]);  // непрозрачный синий
    const level = 0;
    const internalFormat = gl.RGBA;
    const width = 1;
    const height = 1;
    const border = 0;
    const srcFormat = gl.RGBA;
    const srcType = gl.UNSIGNED_BYTE;
    gl.texImage2D(gl.TEXTURE_2D, level, internalFormat, width, height, border, srcFormat, srcType, pixel);
}

export function handleTextureLoaded(image, texture) {
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true); 
    // указывает далее идущему методу gl.texImage2D(), как текстура должна позиционироваться. Так, в данном случае мы 
    // передаем в качестве параметра значение gl.UNPACK_FLIP_Y_WEBGL - этот параметр указывает методу gl.texImage2D(),
    // что изображение надо перевернуть относительно горизонтальной оси.
    
    // Загружаем изображение в текстуру
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
    // Устанавливаем фильтры
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);

    if (isPowerOf2(image.width) && isPowerOf2(image.height)) {
    // Размер соответствует степени 2. Создаем MIP'ы.
        gl.generateMipmap(gl.TEXTURE_2D);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
    } else {
    // Размер не соответствует степени 2.
    // Отключаем MIP’ы и повторение и устанавливаем натяжение по краям
    // также разрешено gl.NEAREST вместо gl.LINEAR, но не mipmap.
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
    }
}

function isPowerOf2(x) {
    return (Math.log(x)/Math.log(2)) % 1 === 0;
}