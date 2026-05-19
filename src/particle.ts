export interface Particle {
    x: number; y: number;
    alpha: number;
    scale: number;

    init(limit: number, speed: number) : void;
    move(time: number, deltaTime: number) : void;
}