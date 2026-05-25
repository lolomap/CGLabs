import { Particle } from "./particle";
import { gl } from "./utils";

export class Emitter<TParticle extends Particle> {
    particles: Array<TParticle> = [];

    constructor(private ParticleClass: new () => TParticle) {}

    spawn(
        count: number,
        minLimit: number,
        maxLimit: number,
        minSpeed: number,
        maxSpeed: number,
        placer?: (particle: Particle) => void
    ) {
        for (let i = 0; i < count; i++) {
            const particle: TParticle = new this.ParticleClass();
            if (placer)
                particle.placer = () => {placer(particle);};
            particle.init(minLimit + Math.random() * (maxLimit - minLimit), minSpeed + Math.random() * (maxSpeed - minSpeed));
            this.particles.push(particle);
        }
    }

    process(time: number, deltaTime: number) {
        this.particles.forEach(particle => {
            particle.move(time, deltaTime);
        });
    }

    apply(vertices: WebGLBuffer) {
        this.particles.sort((a, b) => b.alpha - a.alpha);

        let verticesData = [];

        this.particles.forEach(particle => {
            //Pos
            verticesData.push(particle.x, particle.y, 0);

            //Color
            verticesData.push(0.25, 0.25, 0.25, particle.alpha);

            verticesData.push(particle.scale);
        })

        gl.bindBuffer(gl.ARRAY_BUFFER, vertices);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(verticesData), gl.STATIC_DRAW);
    }
}