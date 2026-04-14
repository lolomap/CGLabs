export const shaderUnlit = `#version 300 es
precision mediump float;

in vec3 vPosition;
in vec3 vNormal;

out vec4 outColor;

void main() {
    outColor = vec4(0.0, 0.0, 1.0, 1.0);
}
`

export const shaderGouraud = `#version 300 es
precision mediump float;

in vec3 vPosition;
in vec3 vLight;

out vec4 outColor;

void main() {
    outColor = vec4(vLight * vec3(0.0, 1.0, 0.0), 1.0);
}
`

export const shaderLambert = `#version 300 es
precision mediump float;

uniform vec3 lightPosition;
uniform vec3 lightColor;
uniform float lightIntensivity;
uniform float lightQuadratic;
uniform float lightLinear;

in vec3 vPosition;
in vec3 vNormal;

out vec4 outColor;

void main() {
    // I = kd * max( dot(N, L), 0 )
    vec3 normal = normalize(vNormal);
    
    vec3 lightDirection = lightPosition - vPosition;
    float distance = length(lightDirection);
    lightDirection = normalize(lightDirection);

    float diff = max(dot(normal, lightDirection), 0.0);
    float attenuation = lightIntensivity / (1.0 + lightLinear * distance + lightQuadratic * distance * distance);

    outColor = vec4(vec3(0.0, 1.0, 0.0) * lightColor * diff * attenuation, 1.0);
}
`

export const shaderPhong = `#version 300 es
precision mediump float;

uniform vec3 lightPosition;
uniform vec3 lightColor;
uniform float lightIntensivity;
uniform float lightQuadratic;
uniform float lightLinear;

uniform float ambientI;
uniform float diffuseI;
uniform float specularI;

in vec3 vPosition;
in vec3 vNormal;

out vec4 outColor;

void main() {
    vec3 normal = normalize(vNormal);

    vec3 lightDirection = lightPosition - vPosition;
    float distance = length(lightDirection);
    lightDirection = normalize(lightDirection);

    float diff = max(dot(normal, lightDirection), 0.0);
    float attenuation = lightIntensivity / (1.0 + lightLinear * distance + lightQuadratic * distance * distance);

    float specular = max(dot(
        normalize(reflect(-lightDirection, normal)),
        -normalize(vPosition)
    ), 0.0);

    vec3 lightWeighting =
        ambientI * lightColor +
        attenuation * diffuseI * lightColor * diff +
        attenuation * specularI * lightColor * pow(specular, lightIntensivity);

    outColor = vec4(lightWeighting.rgb * vec3(0.0, 1.0, 0.0), 1.0);
}
`

export const shaderPhongTextured = `#version 300 es
precision mediump float;

uniform vec3 lightPosition;
uniform vec3 lightColor;
uniform float lightIntensivity;
uniform float lightQuadratic;
uniform float lightLinear;

uniform float ambientI;
uniform float diffuseI;
uniform float specularI;

uniform vec4 tint;
uniform sampler2D sampler;
uniform sampler2D sampler2;
uniform float textureMix;

in vec3 vPosition;
in vec3 vNormal;
in vec2 vUV;

out vec4 outColor;

void main() {
    vec3 normal = normalize(vNormal);

    vec3 lightDirection = lightPosition - vPosition;
    float distance = length(lightDirection);
    lightDirection = normalize(lightDirection);

    float diff = max(dot(normal, lightDirection), 0.0);
    float attenuation = lightIntensivity / (1.0 + lightLinear * distance + lightQuadratic * distance * distance);

    float specular = max(dot(
        normalize(reflect(-lightDirection, normal)),
        -normalize(vPosition)
    ), 0.0);

    vec3 lightWeighting =
        ambientI * lightColor +
        attenuation * diffuseI * lightColor * diff +
        attenuation * specularI * lightColor * pow(specular, lightIntensivity);

    vec4 textureColor = texture(sampler, vUV);
    vec4 textureColor2 = texture(sampler2, vUV);
    vec4 color = tint * mix(textureColor, textureColor2, textureMix);
    
    outColor = vec4(lightWeighting.rgb * color.rgb, 1.0);
}
`