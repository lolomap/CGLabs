export const shaderStripsHorizontal = `#version 300 es
precision mediump float;

in vec4 fragColor;
in vec3 vPosition;

out vec4 outColor;

void main() {
    float scale = 5.0;

    int stripe = int(vPosition.y * scale);

    if ((stripe - (stripe / 2 * 2)) == 0) {
        outColor = fragColor;
    }
    else {
        outColor = vec4(0.0, 0.0, 1.0, fragColor.a);
    }
}
`

export const shaderStripsDiagonal = `#version 300 es
precision mediump float;

in vec4 fragColor;
in vec3 vPosition;

out vec4 outColor;

void main() {
    float scale = 5.0;

    int stripe = int((vPosition.x + vPosition.y + vPosition.z) * scale);

    if ((stripe - (stripe / 2 * 2)) == 0) {
        outColor = fragColor;
    }
    else {
        outColor = vec4(0.0, 1.0, 0.0, fragColor.a);
    }
}
`

export const shaderSquares = `#version 300 es
precision mediump float;

in vec4 fragColor;
in vec3 vPosition;

out vec4 outColor;

void main() {
    float scale = 2.0;

    int sum = int(vPosition.x * scale) + int(vPosition.y * scale) + int(vPosition.z * scale);
    if ((sum - (sum / 2 * 2)) == 0) {
        outColor = vec4(1.0, 0.0, 0.0, 1.0);
    }
    else {
        outColor = fragColor;
    }
}
`

export const shaderColors = `#version 300 es
precision mediump float;

in vec4 fragColor;
in vec3 vPosition;

out vec4 outColor;

void main() {
    outColor = fragColor;
}
`