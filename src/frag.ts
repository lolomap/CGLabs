export const shaderUnlit = `#version 300 es
precision mediump float;

in vec3 vPosition;
in vec3 vNormal;

out vec4 outColor;

void main() {
    outColor = vec4(0.0, 0.0, 1.0, 1.0);
}
`

export const shaderLambert = `#version 300 es
precision mediump float;

uniform vec3 lightPosition;
uniform vec3 lightColor;

in vec3 vPosition;
in vec3 vNormal;

out vec4 outColor;

void main() {
    // I = kd * max( dot(N, L), 0 )
    vec3 normal = normalize(vNormal);
    
    vec3 L = lightPosition - vPosition;
    float distance = length(L);
    L = normalize(L);

    float diff = max(dot(normal, L), 0.0);
    float attenuation = 25.0 / (distance * distance);

    outColor = vec4(vec3(0.0, 0.0, 1.0) * lightColor * diff * attenuation, 1.0);
}
`