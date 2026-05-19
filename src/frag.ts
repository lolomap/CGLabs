export const shaderSparkler = `#version 300 es
precision mediump float;

uniform sampler2D sampler;

in vec3 vPosition;

out vec4 outColor;

void main() {
    outColor = texture(sampler, gl_PointCoord);
}
`

export const shaderSparklerTrail = `#version 300 es
precision mediump float;

in vec3 vPosition;
in vec4 vColor;

out vec4 outColor;

void main() {
    outColor = vec4(vColor.rgb, 1.0);
}
`

export const shaderSmoke = `#version 300 es
precision mediump float;

uniform sampler2D sampler;

in vec3 vPosition;
in vec4 vColor;

out vec4 outColor;

void main() {
    vec4 texColor = texture(sampler, gl_PointCoord);
    outColor = vec4(texColor.rgb, texColor.a * vColor.a);
}

`