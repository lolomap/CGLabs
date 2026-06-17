import { mat4, vec3, vec4 } from 'gl-matrix';
import { SceneObj } from './utils';

export function getRayFromCamera(cameraPos: vec3, cameraFront: vec3) {
    return {
        origin: vec3.clone(cameraPos),
        direction: vec3.clone(cameraFront)
    };
}

export function rayToLocal(origin: vec3, direction: vec3, invertedModel: mat4) {
    const localOrigin = vec3.create();
    vec3.transformMat4(localOrigin, origin, invertedModel);
    const localDirection = vec3.create();
    const temp = vec4.create();
    vec4.transformMat4(temp, [direction[0], direction[1], direction[2], 0], invertedModel);
    vec3.copy(localDirection, temp); vec3.normalize(localDirection, localDirection);
    
    return {localOrigin, localDirection};
}

function interpolateNormal(n0: vec3, n1: vec3, n2: vec3, U: number, V: number) {
    const w = 1.0 - U - V;
    const normal = vec3.create();
    vec3.scaleAndAdd(normal, normal, n0, w);
    vec3.scaleAndAdd(normal, normal, n1, U);
    vec3.scaleAndAdd(normal, normal, n2, V);
    return vec3.normalize(normal, normal);
}

export function getModel(pos: vec3, scale: vec3) {
    let model = mat4.create();
    mat4.translate(model, model, pos);
    mat4.rotate(model, model, -90 * (Math.PI / 180), [0.0, 1.0, 0.0]);
    mat4.scale(model, model, scale);
    return model;
}

export function rayAABB(
    origin: vec3, direction: vec3,
    aabbMin: vec3, aabbMax: vec3,
    invertedModel: mat4
) {
    const {localOrigin, localDirection} = rayToLocal(origin, direction, invertedModel);
    
    let minDistance = -Infinity;
    let maxDistance = Infinity;

    for (let i = 0; i < 3; i++) {
        if (Math.abs(localDirection[i]) < 0.00000001) {
            if (localOrigin[i] < aabbMin[i] || localOrigin[i] > aabbMax[i]) {
                return {hit: false, distance: 0}; // No intersection
            }
        }
        else {
            // Intersections
            const invertedDirection = 1.0 / localDirection[i];
            let distanceNear = (aabbMin[i] - localOrigin[i]) * invertedDirection;
            let distanceFar = (aabbMax[i] - localOrigin[i]) * invertedDirection;
            if (distanceNear > distanceFar){
                [distanceNear, distanceFar] = [distanceFar, distanceNear];
            }

            minDistance = Math.max(minDistance, distanceNear);
            maxDistance = Math.min(maxDistance, distanceFar);

            if (minDistance > maxDistance) {
                return {hit: false, distance: 0};
            }
        }
    }

    return {hit: maxDistance >= 0, distance: Math.max(minDistance, 0)};
}

export function rayTriangleIntersection(
    rayOrigin: vec3,
    rayDirection: vec3,
    vertex0: vec3,
    vertex1: vec3,
    vertex2: vec3
) {
    const edge1 = vec3.create();
    vec3.sub(edge1, vertex1, vertex0);
    const edge2 = vec3.create();
    vec3.sub(edge2, vertex2, vertex0);

    const normal = vec3.create();
    vec3.cross(normal, edge1, edge2);

    let denominator = vec3.dot(rayDirection, normal); // Is ray parallel to triangle
    if (Math.abs(denominator) < 0.0000001) return {hit: false, distance: 0, hitPoint: null, U: 0, V: 0};
    if (denominator > 0) {
        vec3.scale(normal, normal, -1);
        denominator = -denominator;
    }

    const distance = vec3.dot(vec3.sub(vec3.create(), vertex0, rayOrigin), normal) / denominator;
    if (distance < 0) return {hit: false, distance: 0, hitPoint: null, U: 0, V: 0};

    const hitPoint = vec3.create();
    vec3.scaleAndAdd(hitPoint, rayOrigin, rayDirection, distance); // rayOrigin + rayDirection * distance

    // hitPoint == vertex0 + U * edge1 + V * edge2
    const nDot= vec3.dot(normal, normal); // |n|^2
    const U = vec3.dot(vec3.cross(vec3.create(), vec3.sub(vec3.create(), hitPoint, vertex0), edge2), normal) / nDot;
    const V = vec3.dot(vec3.cross(vec3.create(), edge1, vec3.sub(vec3.create(), hitPoint, vertex0)), normal) / nDot;

    if (U < 0 || V < 0 || U + V > 1) {
        return {hit: false, distance: 0, hitPoint: null, U: 0, V: 0};
    }

    return {hit: true, distance, hitPoint, U, V};
}

export function hitScan(
    rayOrigin: vec3,
    rayDirection: vec3,
    scene: Array<SceneObj>
) {
    let closestDistance = Infinity;
    let hitPosition: vec3 | null = null;
    let hitNormal: vec3 | null = null;

    scene.forEach(obj => {
        const objModel = getModel(obj.pos, obj.scale);
        const objInvertedmodel = mat4.create();
        mat4.invert(objInvertedmodel, objModel);

        const aabbResult = rayAABB(rayOrigin, rayDirection, obj.model.aabbMin, obj.model.aabbMax, objInvertedmodel);
        if (!aabbResult.hit) return;

        const {localOrigin, localDirection} = rayToLocal(rayOrigin, rayDirection, objInvertedmodel);
        for (let i = 0; i < obj.model.indices.length; i+=3) { // For each triangle in model

            // Get triangle vertices
            const index0 = obj.model.indices[i], index1 = obj.model.indices[i+1], index2 = obj.model.indices[i+2];
            const vertex0 = [obj.model.vertices[index0*3], obj.model.vertices[index0*3+1], obj.model.vertices[index0*3+2]];
            const vertex1 = [obj.model.vertices[index1*3], obj.model.vertices[index1*3+1], obj.model.vertices[index1*3+2]];
            const vertex2 = [obj.model.vertices[index2*3], obj.model.vertices[index2*3+1], obj.model.vertices[index2*3+2]];

            const triangleHit = rayTriangleIntersection(localOrigin, localDirection, vertex0, vertex1, vertex2);
            if (triangleHit.hit) {            
                // Translate hit to world
                const worldHitPosition = vec3.create();
                vec3.transformMat4(worldHitPosition, triangleHit.hitPoint, objModel);
                const worldDistance = vec3.distance(rayOrigin, worldHitPosition);

                if (worldDistance < closestDistance) {
                    closestDistance = worldDistance;
                    hitPosition = worldHitPosition;

                    // Translate normal to world
                    const localNormal = interpolateNormal(
                        [obj.model.normals[index0*3], obj.model.normals[index0*3+1], obj.model.normals[index0*3+2]],
                        [obj.model.normals[index1*3], obj.model.normals[index1*3+1], obj.model.normals[index1*3+2]],
                        [obj.model.normals[index2*3], obj.model.normals[index2*3+1], obj.model.normals[index2*3+2]],
                        triangleHit.U, triangleHit.V
                    );
                    hitNormal = vec3.create();
                    const temp = [localNormal[0], localNormal[1], localNormal[2], 0.0];
                    vec3.copy(hitNormal, vec4.transformMat4(vec4.create(), temp, objModel));
                    vec3.normalize(hitNormal, hitNormal);
                }
            }
        }
    });

    return {hitNormal, hitPosition};
}