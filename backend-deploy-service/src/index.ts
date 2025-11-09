import { createClient } from "redis";
import { config } from "dotenv";
import { downloadMinIOFolder } from "./minio.js";
import { build } from "./build.js";

config()

const REDIS_URL = process.env.REDIS_URL
if (!REDIS_URL) {
    throw new Error("Redis server URL not set in environment variables")
}

const REDIS_TASK_QUEUE = "build-queue"
const REDIS_STATUS_QUEUE = "status"

const subscriber = createClient({
    url: REDIS_URL
})

async function connectRedis() {
    await subscriber.connect()
}
await connectRedis()

async function sleep(timeout: number) {
    return new Promise((resolve) => { setTimeout(resolve, timeout) })
}

async function main() {
    while (true) {
        const value = await subscriber.blPop(REDIS_TASK_QUEUE, 0)
        if (!value?.element) {
            break
        }
        console.log(value?.element)
        await sleep(5000)
        await downloadMinIOFolder(value?.element)
        await sleep(5000)
        build(value?.element)
    }
}

main()