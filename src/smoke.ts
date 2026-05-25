import { Particle } from "./particle";

export class Smoke implements Particle {
    x: number;
    y: number;
    alpha: number;
    scale: number;
    
    placer = () => {this.x = 0; this.y = 0;};

    lifetime: number;
    velocityX: number; velocityY: number;
    maxVelocityDelta: number;
    maxLifetimeDelta: number;
    scaleSpeed: number;
    speed: number;
    friction: number;

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

        let minDelta = -this.maxVelocityDelta / 2;
        this.velocityX += Math.random() * this.maxVelocityDelta + minDelta;
        this.velocityY += Math.random() * this.maxVelocityDelta + minDelta;

        this.x += this.velocityX * this.speed * deltaTime;
        this.y += this.velocityY * this.speed * deltaTime;

        const damping = Math.exp(-this.friction * deltaTime);
        this.velocityX *= damping;
        this.velocityY *= damping;

        this.alpha = 1 - elapsed / this.lifetime;
        this.scale += this.scaleSpeed * deltaTime;
    }

    reset(speed: number): void {
        this.placer();

        this.maxVelocityDelta = 0.250;
        this.maxLifetimeDelta = 2000; // +- 1 sec
        this.scaleSpeed = 1;
        this.friction = 1.2;

        this.lifetime = this.baseLifetime + (Math.random() * this.maxLifetimeDelta - this.maxLifetimeDelta / 2);
        this.speed = speed;
        
        this.timeFromCreation = performance.now();
        this.velocityX = Math.random() * 2 - 1;
        this.velocityY = Math.random() * 2 - 1;
        this.alpha = 1;
        this.scale = Math.random() * 1.75 - 0.25;
    }

}