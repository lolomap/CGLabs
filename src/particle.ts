
export interface Particle {
    x: number; y: number;
    colorR?: number; colorG?: number; colorB?: number
    alpha: number;
    scale: number;
    isDead?: boolean;
    
    placer: () => void;
    callback?: () => boolean;

    init(limit: number, speed: number) : void;
    move(time: number, deltaTime: number) : void;
}

export function PlaceCircleArea(particle: Particle, radius: number) {
    const r = radius * Math.sqrt(Math.random());
    const angle = 2 * Math.PI * Math.random();
    
    particle.x = r * Math.cos(angle);
    particle.y = r * Math.sin(angle);
}

export function PlaceLineArea(particle: Particle, startX: number, startY: number, endX: number, endY: number) {
    const t = Math.random();
    particle.x = startX + t * (endX - startX);
    particle.y = startY + t * (endY - startY);
}