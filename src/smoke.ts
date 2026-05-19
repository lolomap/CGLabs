import { Particle } from "./particle";

export class Smoke implements Particle {
    x: number;
    y: number;
    alpha: number;
    scale: number;

    lifetime: number;
    velocityX: number; velocityY: number;
    maxVelocityDelta: number;
    maxLifetimeDelta: number;
    scaleSpeed: number;
    speed: number;

    timeFromCreation: number;

    init(lifetime: number, speed: number): void {
        this.reset(lifetime, speed);
    }

    move(time: number, deltaTime: number): void {
        let elapsed = time - this.timeFromCreation;
        if (elapsed >= this.lifetime) {
            this.reset(this.lifetime, this.speed);
            return;
        }

        let minDelta = -this.maxVelocityDelta / 2;
        this.velocityX += Math.random() * this.maxVelocityDelta + minDelta;
        this.velocityY += Math.random() * this.maxVelocityDelta + minDelta;

        this.x += this.velocityX * this.speed * deltaTime;
        this.y += this.velocityY * this.speed * deltaTime;

        this.alpha = 1 - elapsed / this.lifetime;
        this.scale += this.scaleSpeed * deltaTime;
    }

    reset(lifetime: number, speed: number): void {
        this.x = 0;
        this.y = 0;

        this.maxVelocityDelta = 0.250;
        this.maxLifetimeDelta = 2000; // +- 1 sec
        this.scaleSpeed = 1;

        this.lifetime = lifetime + (Math.random() * this.maxLifetimeDelta - this.maxLifetimeDelta / 2);
        this.speed = speed;
        
        this.timeFromCreation = performance.now();
        this.velocityX = Math.random() * 2 - 1;
        this.velocityY = Math.random() * 2 - 1;
        this.alpha = 1;
        this.scale = Math.random() * 1.75 - 0.25;
    }

}