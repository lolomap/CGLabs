import { Particle } from "./particle";
import { gl } from "./utils";

export class Emitter<TParticle extends Particle> {
    particles: Array<TParticle> = [];

    constructor(private ParticleClass: new () => TParticle) {}

    spawn(count: number) {
        for (let i = 0; i < count; i++) {
            const particle: TParticle = new this.ParticleClass()
            particle.init(5 + Math.random() * 5, 125 + Math.random() * 125);
            this.particles.push(particle)
        }
    }

    process(time: number) {
        this.particles.forEach(particle => {
            particle.move(time);
        });
    }

    apply(vertices: WebGLBuffer) {
        let verticesData = [];

        this.particles.forEach(particle => {
            //Pos
            verticesData.push(particle.x, particle.y, 0);

            //Color
            verticesData.push(0, 0, 0);
        })

        gl.bindBuffer(gl.ARRAY_BUFFER, vertices);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(verticesData), gl.STATIC_DRAW);
    }
}