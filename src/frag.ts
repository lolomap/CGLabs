export const shaderSparkler = `#version 300 es
precision mediump float;

uniform sampler2D sampler;

in vec3 vPosition;

out vec4 outColor;

void main() {
    outColor = texture(sampler, gl_PointCoord);
}
`