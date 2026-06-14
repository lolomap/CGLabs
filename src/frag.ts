export const shaderUnlit = `#version 300 es
precision mediump float;

in vec3 vPosition;
in vec3 vNormal;

out vec4 outColor;

void main() {
    outColor = vec4(0.0, 0.0, 1.0, 1.0);
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

export const shaderPhongNormal = `#version 300 es
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
uniform sampler2D map;
uniform float bumpScale;

in vec3 vPosition;
in vec3 vNormal;
in vec2 vUV;

out vec4 outColor;

void main() {
    // U and V directions
    vec3 pos_dx = dFdx(vPosition);
    vec3 pos_dy = dFdy(vPosition);
    vec2 uv_dx = dFdx(vUV);
    vec2 uv_dy = dFdy(vUV);

    float det = uv_dx.x * uv_dy.y - uv_dx.y * uv_dy.x;
    vec3 U = (pos_dx * uv_dy.y - pos_dy * uv_dx.y) / det;
    vec3 V = (pos_dy * uv_dx.x - pos_dx * uv_dy.x) / det;

    // Matrix to transform normals in map from U/V to world
    vec3 N = normalize(vNormal);
    vec3 T = normalize(U - dot(U, N) * N);
    vec3 B = cross(N, T);
    mat3 TBN = mat3(T, B, N);

    // Map
    vec3 tangentNormal = normalize(texture(map, vUV).rgb * 2.0 - 1.0); // [0;1] -> [-1;1]
    vec3 normal = normalize(TBN * tangentNormal);



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
    vec4 color = tint * textureColor;
    
    outColor = vec4(lightWeighting.rgb * color.rgb, 1.0);
}
`