export interface Particle {
    x: number; y: number;

    init(radius: number, speedFactor: number) : void;
    move(time: number) : void;
}