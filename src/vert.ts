export const shaderGouraud = `#version 300 es
uniform mat4 viewProjection;
uniform mat4 model;

in vec3 inPosition;
in vec3 inNormal;

out vec4 vColor;

void main() {
    gl_Position = viewProjection * model * vec4(inPosition, 1.0);
    vPosition = inPosition;
    vColor = vec4(1.0, 1.0, 1.0, 1.0);
}
`

export const shaderPhong = `#version 300 es
uniform mat4 viewProjection;
uniform mat4 model;

in vec3 inPosition;
in vec3 inNormal;

out vec3 vPosition;
out vec3 vNormal;

void main() {
    vec4 worldPos = model * vec4(inPosition, 1.0);
    gl_Position = viewProjection * worldPos;
    vPosition = worldPos.xyz;
    vNormal = normalize( transpose( inverse( mat3( model ) ) ) * inNormal ); // NormalMatrix = (ModelLinear^-1)T
}
`