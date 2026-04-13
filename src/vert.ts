export const shaderGouraudLambert = `#version 300 es
uniform mat4 viewProjection;
uniform mat4 model;

uniform vec3 lightPosition;
uniform vec3 lightColor;
uniform float lightIntensivity;
uniform float lightQuadratic;
uniform float lightLinear;

in vec3 inPosition;
in vec3 inNormal;

out vec3 vPosition;
out vec3 vLight;

void main() {
    vec4 worldPos = model * vec4(inPosition, 1.0);
    gl_Position = viewProjection * worldPos;
    vPosition = worldPos.xyz;

    vec3 normal = normalize(transpose(inverse(mat3(model))) * inNormal);

    vec3 lightDirection = lightPosition - vPosition;
    float distance = length(lightDirection);
    lightDirection = normalize(lightDirection);

    float diff = max(dot(normal, lightDirection), 0.0);
    float attenuation = lightIntensivity / (1.0 + lightLinear * distance + lightQuadratic * distance * distance);

    vLight = lightColor * diff * attenuation;
}
`

export const shaderGouraudPhong = `#version 300 es
uniform mat4 viewProjection;
uniform mat4 model;

uniform vec3 lightPosition;
uniform vec3 lightColor;
uniform float lightIntensivity;
uniform float lightQuadratic;
uniform float lightLinear;

uniform float ambientI;
uniform float diffuseI;
uniform float specularI;

in vec3 inPosition;
in vec3 inNormal;

out vec3 vPosition;
out vec3 vLight;

void main() {
    vec4 worldPos = model * vec4(inPosition, 1.0);
    gl_Position = viewProjection * worldPos;
    vPosition = worldPos.xyz;

    vec3 normal = normalize(transpose(inverse(mat3(model))) * inNormal);

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

    vLight = lightWeighting.rgb;
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

export const shaderPhongTextured = `#version 300 es
uniform mat4 viewProjection;
uniform mat4 model;

in vec3 inPosition;
in vec3 inNormal;
in vec2 inUV;

out vec3 vPosition;
out vec3 vNormal;
out vec2 vUV;

void main() {
    vec4 worldPos = model * vec4(inPosition, 1.0);
    gl_Position = viewProjection * worldPos;
    vPosition = worldPos.xyz;
    vNormal = normalize( transpose( inverse( mat3( model ) ) ) * inNormal ); // NormalMatrix = (ModelLinear^-1)T
    vUV = inUV;
}
`