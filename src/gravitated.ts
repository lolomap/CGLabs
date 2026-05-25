import { Particle } from "./particle";

export class GravityParticle implements Particle {
    x: number;
    y: number;
    alpha: number;
    scale: number;
    
    placer = () => {this.x = 0; this.y = 0;};

    lifetime: number;
    velocityX: number; velocityY: number;
    maxLifetimeDelta: number;
    speed: number;
    gravityX: number = 0; gravityY: number = 0;

    timeFromCreation: number;
    baseLifetime: number;

    init(lifetime: number, speed: number): void {
        this.baseLifetime = lifetime;
        this.reset(speed);
    }

    move(time: number, deltaTime: number): void {
        let elapsed = time - this.timeFromCreation;
        if (elapsed >= this.lifetime) {
            this.reset(this.speed);
            return;
        }

        this.x += this.velocityX * this.speed * deltaTime;
        this.y += this.velocityY * this.speed * deltaTime;

        this.velocityX += this.gravityX * deltaTime;
        this.velocityY += this.gravityY * deltaTime;
    }

    reset(speed: number): void {
        this.placer();

        this.maxLifetimeDelta = 2000; // +- 1 sec

        this.lifetime = this.baseLifetime;// + (Math.random() * this.maxLifetimeDelta - this.maxLifetimeDelta / 2);
        this.speed = speed;
        
        this.timeFromCreation = performance.now() - Math.random() * this.lifetime;
        this.velocityX = 1;
        this.velocityY = 0;
        this.alpha = 1;
        this.scale = 1;
    }

    resolveCollisions(objects: Array<MassObject>): void {
        for (const obj of objects) {
            if (!obj.radius) continue;
            const dx = this.x - obj.x;
            const dy = this.y - obj.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < obj.radius) {
                const nx = dx / dist;
                const ny = dy / dist;

                this.x = obj.x + nx * obj.radius;
                this.y = obj.y + ny * obj.radius;

                const vn = this.velocityX * nx + this.velocityY * ny;
                if (vn < 0) {
                    this.velocityX -= vn * nx * 0.8;
                    this.velocityY -= vn * ny * 0.8;
                }
            }
        }
    }

}

export class MassObject {
    x: number;
    y: number;
    mass: number;
    radius: number;
}

export function getGravInPos(x: number, y: number, objects: Array<MassObject>) : {gx: number, gy: number} {
    let gx = 0, gy = 0;
    const G = 1.0;
    const minDist = 0.001;

    for (const obj of objects) {
        const dx = obj.x - x;
        const dy = obj.y - y;
        const distSq = dx * dx + dy * dy;
        const dist = Math.sqrt(distSq);
        
        const effDist = Math.max(dist, minDist);
        
        let accMag: number;
        if (dist < obj.radius && obj.radius > 0) {
            // inside: a = G * M * r / R^3
            accMag = (G * obj.mass * dist) / (obj.radius * obj.radius * obj.radius);
        } else {
            // outside: a = G * M / r^2
            const effDist = Math.max(dist, minDist);
            accMag = (G * obj.mass) / (effDist * effDist);
        }

        if (dist > 0) {
            const normX = dx / dist;
            const normY = dy / dist;
            gx += accMag * normX;
            gy += accMag * normY;
        }
    }
    return { gx, gy };
}