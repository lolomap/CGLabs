import { Vector2 } from "./utils";


export interface Particle {
    x: number; y: number;
    alpha: number;
    scale: number;

    placer: () => void;

    init(limit: number, speed: number) : void;
    move(time: number, deltaTime: number) : void;
}

export function PlaceCircleArea(particle: Particle, radius: number) {
    const r = radius * Math.sqrt(Math.random());
    const angle = 2 * Math.PI * Math.random();
    
    particle.x = r * Math.cos(angle);
    particle.y = r * Math.sin(angle);
}

export function PlaceLineArea(particle: Particle, start: Vector2, end: Vector2) {
    const t = Math.random();
    particle.x = start.x + t * (end.x - start.x);
    particle.y = start.y + t * (end.y - start.y);
}