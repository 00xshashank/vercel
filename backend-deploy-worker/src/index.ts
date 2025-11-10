import express, { type Request, type Response } from "express";
import cors from 'cors'

import { downloadMinIOFolder } from './minio.js'
import { build } from "./build.js";

const PORT = 3010

const app = express()
app.use(express.json())
app.use(cors())

app.post('/api/services/workers/deploy', async (req: Request, res: Response) => {
    const id = req.body.id ?? ""
    if (!id) {
        return res.json({
            "status": "failure",
            "message": "Malformed request: Could not get ID"
        })
    }

    await downloadMinIOFolder(id)
    build(id)

    return res.send({
        "status": "success",
        "message": "Build completed successfully"
    })
})

app.listen(PORT, () => {
    console.log(`Server listening on port: ${PORT}`)
})