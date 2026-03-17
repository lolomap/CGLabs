
export async function readFile(path:string) {
    const response = await fetch(path);
    if (!response.ok) {
        throw new Error("Failed to load file: " + path);
    }
    return await response.text();
}

export async function loadOBJs() {
    return {
        snowman: await readFile('snowman.obj')
    };
}