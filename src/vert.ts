export const shaderSparkler = `#version 300 es
uniform mat4 viewProjection;
uniform mat4 model;

in vec3 inPosition;

out vec3 vPosition;

void main() {
    vec4 worldPos = model * vec4(inPosition, 1.0);
    gl_Position = viewProjection * worldPos;
    vPosition = worldPos.xyz;

    gl_PointSize = 32.0;
}
`