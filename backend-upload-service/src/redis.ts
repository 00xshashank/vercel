import { createClient, type RedisClientType } from "redis"

const REDIS_URL = process.env.REDIS_URL
if (!REDIS_URL) {
    throw new Error("Redis URL not set in environment variables")
}

const REDIS_TASK_QUEUE = "build-queue"
const REDIS_STATUS_QUEUE = "status"

const publisher = createClient({
    url: REDIS_URL
})
publisher.on("error", (err) => console.error("Redis error:", err));

async function connectRedis() {
    await publisher.connect()
}
connectRedis()

export async function enqueueAfterUpload(id: string) {
    if (!publisher) {
        throw new Error("Publisher failed to initialize before calling enqueue function.")
    }
    await publisher.lPush(REDIS_TASK_QUEUE, id)
    await publisher.hSet(REDIS_STATUS_QUEUE, id, "uploaded")
} 

export async function fetchStatus(id: string) {
    const status = await publisher.hGet(REDIS_STATUS_QUEUE, id)
    return status
}