import { 
    S3Client, 
    GetObjectCommand, 
    ListObjectsV2Command, 
    type ListObjectsV2CommandOutput, 
    ListBucketsCommand
} from '@aws-sdk/client-s3'
import { mkdir, writeFile } from 'fs/promises'
import { config } from "dotenv";
import { dirname } from 'path';

config()

const MINIO_URL = process.env.MINIO_URL
if (!MINIO_URL) {
    throw new Error("Minio URL not set in environment variables")
}

const MINIO_USERNAME = process.env.MINIO_USERNAME
console.log(MINIO_USERNAME)
if (!MINIO_USERNAME) {
    throw new Error("Minio username not set in environment variables")
}

const MINIO_PASSWORD = process.env.MINIO_PASSWORD
console.log(MINIO_PASSWORD)
if (!MINIO_PASSWORD) {
    throw new Error("Minio password not set in environment variables")
}

const MINIO_CLONE_BUCKET_NAME = process.env.MINIO_CLONE_BUCKET_NAME
if (!MINIO_CLONE_BUCKET_NAME) {
    throw new Error("MINIO_CLONE_BUCKET_NAME not set in environment variables")
}

const s3 = new S3Client({
    endpoint: MINIO_URL,
    region: "us-east-1",
    credentials: {
        accessKeyId: MINIO_USERNAME,
        secretAccessKey: MINIO_PASSWORD
    },
    forcePathStyle: true
})

async function bufferToText(stream: any): Promise<Buffer> {
    const chunks: Buffer[] = []

    for await (const chunk of stream) {
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
    }
    return Buffer.concat(chunks)
}

async function getFilesWithKey(id: string) {
    var continuationToken: string | undefined = undefined

    var keys: string[] = []
    do {
        const listCommand = new ListObjectsV2Command({
            Bucket: MINIO_CLONE_BUCKET_NAME,
            ContinuationToken: continuationToken,
            Prefix: `${id}`
        })
        
        const response = await s3.send(listCommand) as ListObjectsV2CommandOutput
        console.log("Response:\n", response)
        console.log("Response contents: \n", response.Contents)
        var keySet: (string | undefined)[] = response.Contents?.map((obj) => obj.Key).filter(Boolean) ?? []
        console.log("Key set:\n", keySet)
        keys.push(...keySet.filter((k): k is string => typeof k === "string"))

        continuationToken = response.IsTruncated ? response.NextContinuationToken : undefined 
    } while (continuationToken)

    return keys
}

export async function downloadMinIOFolder(id: string) {
    const fileNames = await getFilesWithKey(id)

    await Promise.all(
        fileNames.map(async (key) => {
            const getCommand: GetObjectCommand = new GetObjectCommand({
                Bucket: MINIO_CLONE_BUCKET_NAME,
                Key: key
            });
            const getCommandResponse = await s3.send(getCommand)
            const textBuffer = await bufferToText(getCommandResponse.Body)

            await mkdir(dirname(`./downloads/${key}`), { recursive: true });
            await writeFile(`./downloads/${key}`, textBuffer)
            console.log(`Saved ${key}`)
        })
    )
}