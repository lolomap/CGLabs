import { Particle } from "./particle";

export class Snow implements Particle {
    x: number;
    y: number;
    alpha: number;
    scale: number;
    
    placer = () => {this.x = 0; this.y = 0;};

    lifetime: number;
    velocityX: number; velocityY: number;
    maxLifetimeDelta: number;
    scaleSpeed: number;
    speed: number;
    gravity: number;

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

        this.velocityY -= this.gravity * deltaTime;

        this.scale += this.scaleSpeed * deltaTime;
    }

    reset(speed: number): void {
        this.placer();

        this.maxLifetimeDelta = 2000; // +- 1 sec
        this.scaleSpeed = -0.2;
        this.gravity = 9.8;

        this.lifetime = this.baseLifetime + (Math.random() * this.maxLifetimeDelta - this.maxLifetimeDelta / 2);
        this.speed = speed;
        
        this.timeFromCreation = performance.now() - Math.random() * this.lifetime;
        this.velocityX = 0;
        this.velocityY = -1;
        this.alpha = 1;
        this.scale = 0.5;
    }

}