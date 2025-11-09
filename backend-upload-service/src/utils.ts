import { glob } from "glob"

export function generateId() {
    const vocab = "abcdefghijklmnopqrstuvwxyz12345690"
    const length = vocab.length

    var str = ""
    for (let i=0; i<10; i++) {
        str += vocab[Math.floor(Math.random() * length)]
    }
    
    return str;
}

export async function getFiles(path: string): Promise<string[]> {
    const files = await glob(`${path}/**/*`, { nodir: true })
    return files
}