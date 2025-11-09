import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import dotenv from 'dotenv'
import fs from 'fs'

dotenv.config()

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

const s3 = new S3Client({
    endpoint: MINIO_URL,
    region: "us-east-1",
    credentials: {
        accessKeyId: MINIO_USERNAME,
        secretAccessKey: MINIO_PASSWORD
    },
    forcePathStyle: true
})


export async function sendFile(bucket: string, key: string, filePath: string) {
    try {
        const fileStream = fs.createReadStream(filePath)
        fileStream.on("error", (err) => console.error("File stream error:", err));

        const split: string[] = filePath.split(key)
        const fKey = split[split.length - 1] ?? filePath
        const fileKey = fKey.replace(/\\/g, "/");

        await s3.send(new PutObjectCommand({
            Bucket: bucket,
            Key: key + fileKey,
            Body: fileStream
        }))

        console.log(`Uploaded file with key: ${key}`)
    } catch (err: any) {
        console.log(`Error while uploading files: ${err}`)
    }
}
