import { Particle } from "./particle";

export class Spark implements Particle {
    scale: number = 1;
    alpha: number = 1;
    radius: number;
    speedFactor: number;

    timeFromCreation: number;
    directionAngle: number;
    xMax: number;
    yMax: number;

    velocityX: number; velocityY: number;
    x: number; y: number;

    init(radius: number, speedFactor: number) {
        this.reset(radius, speedFactor);
    }

    reset(radius: number, speedFactor: number) {
        this.radius = radius;
        this.speedFactor = speedFactor;

        this.timeFromCreation = performance.now();
        this.directionAngle = Math.random() * 360;
        this.xMax = Math.cos(this.directionAngle) * this.radius;
        this.yMax = Math.sin(this.directionAngle) * this.radius;

        this.velocityX = this.xMax / speedFactor;
        this.velocityY = this.yMax / speedFactor;

        this.x = (this.velocityX * 1000) % this.xMax;
        this.y = (this.velocityY * 1000) % this.yMax;
    }

    move(time: number, deltaTime: number) {
        let elapsed = time - this.timeFromCreation;
        this.timeFromCreation = time;

        let speed = elapsed;
        this.x += this.velocityX * speed;
        this.y += this.velocityY * speed;

        if (Math.abs(this.x) > Math.abs(this.xMax) || Math.abs(this.y) > Math.abs(this.yMax)) {
            this.reset(this.radius, this.speedFactor);
            return;
        }
    }
}