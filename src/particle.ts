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