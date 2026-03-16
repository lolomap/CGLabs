export const shader = `#version 300 es
uniform mat4 viewProjection;
uniform mat4 model;

in vec3 inPosition;
in vec4 inColor;

out vec4 fragColor;
out vec3 vPosition;

void main() {
    gl_Position = viewProjection * model * vec4(inPosition, 1.0);
    fragColor = inColor;
    vPosition = inPosition;
}
`