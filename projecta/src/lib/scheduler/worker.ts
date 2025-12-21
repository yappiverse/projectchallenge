import { Worker } from "bullmq";

import { schedulerConfig } from "@/lib/env";
import { generateIncidentSummary } from "@/lib/incident/incident-engine";
import { persistIncidentSummary } from "@/lib/incident/summary-persistence";
import { createRedisConnection } from "@/lib/redis/client";
import { getSchedulerQueueEvents } from "@/lib/scheduler/queue";
import { buildScheduleReportTemplate } from "@/lib/scheduler/prompt-template";
import { getScheduleRecord, markScheduleRun } from "@/lib/scheduler/service";
import type { ScheduleJobData } from "@/lib/scheduler/types";
import type { NormalizedLog } from "@/lib/signoz/types";

let workerCreated = false;

export function ensureSchedulerWorker() {
    if (workerCreated) return;
    workerCreated = true;

    const worker = new Worker<ScheduleJobData>(
        schedulerConfig.queueName,
        async (job) => {
            const schedule = await getScheduleRecord(job.data.scheduleId);
            if (!schedule) {
                console.warn(`[scheduler] missing schedule ${job.data.scheduleId}`);
                return;
            }

            const payload = schedule.payload ?? job.data.payload;
            const windowMs = job.data.windowMs || schedule.windowMs;
            const end = job.timestamp ?? Date.now();
            const start = end - windowMs;
            const result = await generateIncidentSummary(payload, {
                logQuery: { start, end },
                template: ({ logs }) =>
                    buildScheduleReportTemplate({
                        start,
                        end,
                        generatedAt: end,
                        scheduleId: schedule.id,
                        scheduleName: schedule.name,
                        labels: payload.commonLabels ?? {},
                        serviceName: deriveServiceNameFromLogs(logs, payload.commonLabels),
                    }),
            });

            await persistIncidentSummary(payload, result);
            await markScheduleRun(schedule.id, {
                start: new Date(start).toISOString(),
                end: new Date(end).toISOString(),
            });
        },
        {
            connection: createRedisConnection(),
        },
    );

    worker.on("failed", (job, error) => {
        console.error("[scheduler] job failed", job?.id, error);
    });

    worker.on("error", (error) => {
        console.error("[scheduler] worker error", error);
    });

    getSchedulerQueueEvents();
}

function deriveServiceNameFromLogs(
    logs: NormalizedLog[],
    labels?: Record<string, string | undefined>,
): string | undefined {
    for (const log of logs) {
        if (log?.service) {
            return log.service;
        }
    }
    return (
        labels?.["service.name"] ||
        labels?.service ||
        labels?.serviceName ||
        labels?.["k8s.service.name"]
    );
}
