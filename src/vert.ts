export const shaderSparkler = `#version 300 es
uniform mat4 viewProjection;
uniform mat4 model;

in vec3 inPosition;
in vec3 inColor;

out vec3 vPosition;
out vec3 vColor;

void main() {
    vec4 worldPos = model * vec4(inPosition, 1.0);
    gl_Position = viewProjection * worldPos;
    vPosition = worldPos.xyz;

    gl_PointSize = 32.0;
    vColor = inColor;
}
`

export const shaderSparklerTrail = `#version 300 es
uniform mat4 viewProjection;
uniform mat4 model;

in vec3 inPosition;
in vec3 inColor;

out vec3 vPosition;
out vec3 vColor;

void main() {
    vec4 worldPos = model * vec4(inPosition, 1.0);
    gl_Position = viewProjection * worldPos;
    vPosition = worldPos.xyz;
    vColor = inColor;
}
`