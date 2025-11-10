import { createClient } from "redis";
import { config } from "dotenv";

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

async function setStaus(id: string, status: string) {
    subscriber.hSet(REDIS_STATUS_QUEUE, id, status)
}

async function sleep(timeout: number) {
    return new Promise((resolve) => { setTimeout(resolve, timeout) })
}

async function main() {
    while (true) {
        const value = await subscriber.blPop(REDIS_TASK_QUEUE, 0)
        if (!value?.element) {
            break
        }
        const id: string = value.element
        console.log(id)
        await sleep(5000)

        const response = await fetch('http://localhost:3010/api/services/workers/deploy', {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                id: id
            })
        });

        if (response.body === null) {
            console.log("Recieved malformed response from backend.")
            return;
        }
        const jsonResponse = await response.json()
        const status = await jsonResponse.status ?? ""
        if (status === "success") {
            console.log("Successfully built.")
        } else {
            console.log("Build failed.")
        }

        setStaus(value?.element, "Deployed")
    }
}

main()