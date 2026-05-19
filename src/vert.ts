export const shaderSparkler = `#version 300 es
uniform mat4 viewProjection;
uniform mat4 model;

in vec3 inPosition;
in vec4 inColor;
in float inScale;

out vec3 vPosition;
out vec4 vColor;

void main() {
    vec4 worldPos = model * vec4(inPosition, 1.0);
    gl_Position = viewProjection * worldPos;
    vPosition = worldPos.xyz;

    gl_PointSize = 32.0 * inScale;
    vColor = inColor;
}
`

export const shaderSparklerTrail = `#version 300 es
uniform mat4 viewProjection;
uniform mat4 model;

in vec3 inPosition;
in vec4 inColor;
in float inScale;

out vec3 vPosition;
out vec4 vColor;
out float vScale; // prevent optimization

void main() {
    vec4 worldPos = model * vec4(inPosition, 1.0);
    gl_Position = viewProjection * worldPos;
    vPosition = worldPos.xyz;
    vScale = inScale;  // prevent optimization
    vColor = inColor;
}
`

export const shaderSmoke = `#version 300 es
uniform mat4 viewProjection;
uniform mat4 model;

in vec3 inPosition;
in vec4 inColor;
in float inScale;

out vec3 vPosition;
out vec4 vColor;

void main() {
    vec4 worldPos = model * vec4(inPosition, 1.0);
    gl_Position = viewProjection * worldPos;
    vPosition = worldPos.xyz;

    gl_PointSize = 32.0 * inScale;
    vColor = inColor;
}

`