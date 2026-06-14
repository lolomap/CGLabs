
export async function readFile(path:string) {
    const response = await fetch(path);
    if (!response.ok) {
        throw new Error("Failed to load file: " + path);
    }
    return await response.text();
}

export async function loadOBJs() {
    return {
        cube: await readFile('cube.obj'),
        sphere: await readFile('sphere3.obj'),

        human: await readFile('human.obj'),



        // pigeon: await readFile('pigeon.obj'),
        // snowman: await readFile('snowman.obj'),
        // grenade: await readFile('grenade.obj'),
        // mug: await readFile('mug.obj'),
        // rock: await readFile('rock.obj')
    };
}