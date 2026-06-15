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

uniform sampler2D decalTexture;

struct Decal {
    vec4 position;
    vec4 halfSize;
    vec4 normal;
    vec4 up;
};

layout(std140) uniform DecalsData {
    int decalsCount;
    int _pad0; int _pad1; int _pad2; // Padding for correct memory layout
    Decal decals[256];
};
const int MAX_DECALS = 256;

in vec3 vPosition;
in vec3 vNormal;
in vec2 vUV;

out vec4 outColor;

vec3 getDecalLocalPos(vec3 worldPos, vec3 decalPosition, vec3 decalNormal, vec3 decalUp) {
    vec3 decalToFragment = worldPos - decalPosition;

    vec3 decalRight = normalize(cross(decalUp, decalNormal));
    vec3 decalLocalY = cross(decalNormal, decalRight);

    mat3 rotation = mat3(decalRight, decalLocalY, decalNormal);
    return decalToFragment * rotation;
}

vec3 getDecalColor(vec3 worldPos, vec3 worldNormal, vec3 baseColor) {
    vec3 resultColor = baseColor;

    for (int i = 0; i < MAX_DECALS; i++) {
        if (i >= decalsCount) break;

        Decal decal = decals[i];
        vec3 decalNormal = normalize(decal.normal.xyz);
        vec3 decalUp = normalize(decal.up.xyz);
        vec3 localPos = getDecalLocalPos(worldPos, decal.position.xyz, decalNormal, decalUp);

        if (
            abs(localPos.x) <= decal.halfSize.x &&
            abs(localPos.y) <= decal.halfSize.y &&
            abs(localPos.z) <= decal.halfSize.z
        ) {
            if (dot(worldNormal, decalNormal) > 0.1) {
                vec2 decalUV = localPos.xy / (decal.halfSize.xy * 2.0) + 0.5;
                vec4 decalColor = texture(decalTexture, decalUV);
                resultColor = mix(resultColor, decalColor.rgb, decalColor.a);
            }    
        }
    }

    return resultColor;
}

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
    color.rgb = getDecalColor(vPosition, normal, color.rgb);
    
    outColor = vec4(lightWeighting.rgb * color.rgb, 1.0);
}
`