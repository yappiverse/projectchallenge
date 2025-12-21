import { Queue, QueueEvents } from "bullmq";

import { schedulerConfig } from "@/lib/env";
import { createRedisConnection } from "@/lib/redis/client";

let queueInstance: Queue | undefined;
let queueEventsInstance: QueueEvents | undefined;

export function getSchedulerQueue(): Queue {
    if (!queueInstance) {
        queueInstance = new Queue(schedulerConfig.queueName, {
            connection: createRedisConnection(),
        });
    }
    return queueInstance;
}

export function getSchedulerQueueEvents(): QueueEvents {
    if (!queueEventsInstance) {
        queueEventsInstance = new QueueEvents(schedulerConfig.queueName, {
            connection: createRedisConnection(),
        });
        queueEventsInstance.on("error", (error) => {
            console.error("[scheduler] queue events error", error);
        });
    }
    return queueEventsInstance;
}
