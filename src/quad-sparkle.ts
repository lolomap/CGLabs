// quad-particle.ts
import { Particle } from './particle';

export class QuadParticle implements Particle {
    x: number;
    y: number;
    alpha: number;
    scale: number;
    
    placer = () => { this.x = 0; this.y = 0; };
    
    velocityX: number;
    velocityY: number;
    lifetime: number;
    speed: number;
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
        
        
        // const angle = Math.atan2(this.velocityY, this.velocityX);
        // this.rotation = angle;
        // this.width = 0.5 + Math.hypot(this.velocityX, this.velocityY) * 0.2;
        // this.height = 0.2;

        // this.alpha = 1 - elapsed / this.lifetime;
    }
    
    reset(speed: number): void {
        this.placer();
        this.lifetime = this.baseLifetime;
        this.speed = speed;
        this.timeFromCreation = performance.now();
        this.velocityX = Math.random() * 2 - 1;
        this.velocityY = Math.random() * 2 - 1;
        this.alpha = 1;
        this.scale = 1;
    }
}