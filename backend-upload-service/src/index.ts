import express, { type Request, type Response } from 'express';
import { simpleGit } from 'simple-git';
import { resolve } from 'path';
import CORS from 'cors'
import dotenv from 'dotenv'

import { PostDeployURLType } from './types.js';
import { generateId, getFiles } from './utils.js';
import { sendFile } from './minio.js';
import { enqueueAfterUpload, fetchStatus } from './redis.js';

const PORT = 3000;

const app = express();
app.use(express.json());
app.use(CORS());

dotenv.config();

const MINIO_CLONE_BUCKET_NAME = process.env.MINIO_CLONE_BUCKET_NAME
if (!MINIO_CLONE_BUCKET_NAME) {
    throw new Error("MINIO_CLONE_BUCKET_NAME not set in environment variables")
}

app.post('/api/v1/deploy', async (req: Request, res: Response) => {
    const jsonReq = await req.body;
    const parsedResult = PostDeployURLType.safeParse(jsonReq);
    
    if (!parsedResult.error) {
        const data = parsedResult.data;
        
        const sGit = simpleGit()
        const id = generateId()

        const CLONE_PATH = resolve(import.meta.dirname, "./out", id);
        await sGit.clone(data.repoUrl, CLONE_PATH)

        const files = await getFiles(CLONE_PATH)
        console.log(files)

        files.forEach(async (filePath, idx) => {
            await sendFile(MINIO_CLONE_BUCKET_NAME, `${id}`, filePath)
        })

        enqueueAfterUpload(id);

        return res.send({
            "status": "success",
            "repoUrl": `${data.repoUrl}`
        })
    }

    return res.send({
        "status": "failure",
        "message": "Failed to parse request body."
    })
});

app.get('/api/v1/status', async (req: Request, res: Response) => {
    const id = req.query.id as string
    if (!id) {
        return res.send({
            "message": "No project ID requested."
        })
    }

    const status = await fetchStatus(id)
    res.json({
        "status": status
    })
})

app.listen(PORT, () => {
    console.log(`Upload service backend server listening on port ${PORT}`);
})