import { exec } from "child_process";

import { uploadFolder } from './minio.js'

export function build(id: string) {
    exec(`cd ./downloads/${id} && npm install && npm run build`, (error, stdout, stderr) => {
        if (error) {
            console.log("Error:\n", error)
        }
        if (stderr) {
            console.log("Stderr:\n", stderr)
        }
        console.log("Stdout:\n", stdout)

        uploadFolder(id)
    })
}