// quad-particle.ts
import { vec2 } from 'gl-matrix';
import { Particle } from './particle';

export class QuadParticle implements Particle {
    x: number;
    y: number;
    alpha: number;
    scale: number;
    colorR: number; colorG: number; colorB: number

    isDead: boolean;
    
    placer = () => { this.x = 0; this.y = 0; };
    callback = () => {return false;};
    
    velocityX: number;
    velocityY: number;
    lifetime: number;
    speed: number;
    timeFromCreation: number = 0;
    baseLifetime: number;

    gravity: number;
    friction: number;
    
    
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
        
        this.velocityY -= this.gravity * deltaTime;
        this.velocityX *= this.friction;
        this.velocityY *= this.friction;

        let t = elapsed / this.lifetime;
        let fade = Math.sqrt(1 - t);
        this.alpha = fade;
    }
    
    reset(speed: number): void {
        if (this.timeFromCreation != 0) {
            let isDestroyed = this.callback();
            if (isDestroyed) {
                this.onDestroy();
                return;
            }
        }

        this.placer();
        this.lifetime = this.baseLifetime;
        this.speed = speed;
        this.timeFromCreation = performance.now();
        let velocity: vec2 = [Math.random() * 2 - 1, Math.random() * 2 - 1];
        vec2.normalize(velocity, velocity);
        this.velocityX = velocity[0]; this.velocityY = velocity[1];
        this.alpha = 1;
        this.colorR = Math.random();
        this.colorG = Math.random();
        this.colorB = Math.random();

        this.gravity = 1 + Math.random();
        this.friction = 0.96 + Math.random() * 0.03;
    }

    onDestroy() {
        this.isDead = true;
    }
}