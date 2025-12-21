import crypto from "node:crypto";

import { isAlertmanagerPayload, type WebhookPayload } from "@/lib/incident/alertmanager";
import { getSchedulerQueue } from "@/lib/scheduler/queue";
import {
    deleteScheduleRecord,
    getScheduleRecord,
    listScheduleRecords,
    saveScheduleRecord,
    upsertScheduleRecord,
} from "@/lib/scheduler/store";
import {
    computeStartDate,
    durationToMs,
    ensureMinimumIntervalMs,
    normalizeAnchor,
    normalizeDuration,
} from "@/lib/scheduler/utils";
import type {
    ScheduleDefinitionInput,
    ScheduleJobData,
    ScheduleRecord,
    ScheduleRange,
} from "@/lib/scheduler/types";

const DEFAULT_PAYLOAD: WebhookPayload = {
    receiver: "scheduler",
    alerts: [],
    commonLabels: { alertname: "Scheduled Incident" },
    commonAnnotations: { summary: "Automated incident summary" },
};

const JOB_NAME = "scheduled-incident";

export function buildJobId(scheduleId: string) {
    return `schedule:${scheduleId}`;
}

export async function createSchedule(input: ScheduleDefinitionInput): Promise<ScheduleRecord> {
    const duration = normalizeDuration(input.duration);
    const intervalMs = ensureMinimumIntervalMs(durationToMs(duration));
    if (intervalMs <= 0) {
        throw new Error("Duration must be greater than zero");
    }

    const windowMinutes = Number.isFinite(input.windowMinutes)
        ? Math.max(1, Math.trunc(input.windowMinutes as number))
        : undefined;
    const windowMs = windowMinutes ? windowMinutes * 60 * 1000 : intervalMs;

    const anchor = input.mode === "aligned" ? normalizeAnchor(input.anchor ?? { hour: 0, minute: 0, second: 0 }) : null;
    const startDate = computeStartDate(input.mode, duration, anchor ?? undefined);
    const payload = resolvePayload(input.payload, input.name);

    const schedule: ScheduleRecord = {
        id: crypto.randomUUID(),
        name: input.name || `Schedule ${new Date().toISOString()}`,
        mode: input.mode,
        duration,
        anchor,
        windowMinutes: windowMinutes ?? undefined,
        payload,
        intervalMs,
        windowMs,
        createdAt: new Date().toISOString(),
        nextRunAt: startDate.toISOString(),
    };

    const queue = getSchedulerQueue();
    const jobData: ScheduleJobData = {
        scheduleId: schedule.id,
        windowMs: schedule.windowMs,
        payload,
    };

    const job = await queue.add(JOB_NAME, jobData, {
        jobId: buildJobId(schedule.id),
        repeat: {
            every: intervalMs,
            startDate,
        },
        removeOnFail: 200,
        removeOnComplete: 50,
    });

    schedule.repeatJobKey = job?.repeatJobKey ?? undefined;

    await saveScheduleRecord(schedule);
    return schedule;
}

export async function listSchedules(): Promise<ScheduleRecord[]> {
    const [stored, repeatable] = await Promise.all([
        listScheduleRecords(),
        getSchedulerQueue().getRepeatableJobs(),
    ]);

    const nextByJobId = new Map<string, number | undefined>();
    for (const job of repeatable) {
        if (!job.id) continue;
        nextByJobId.set(job.id, job.next);
    }

    return stored
        .map((record) => {
            const jobNext = nextByJobId.get(buildJobId(record.id));
            return jobNext ? { ...record, nextRunAt: new Date(jobNext).toISOString() } : record;
        })
        .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

export async function removeSchedule(scheduleId: string): Promise<boolean> {
    const record = await getScheduleRecord(scheduleId);
    if (!record) return false;

    const queue = getSchedulerQueue();
    let repeatKey = record.repeatJobKey;
    if (!repeatKey) {
        const repeatable = await queue.getRepeatableJobs();
        const match = repeatable.find((job) => job.id === buildJobId(record.id));
        repeatKey = match?.key;
    }

    if (repeatKey) {
        await queue.removeRepeatableByKey(repeatKey);
    }

    await deleteScheduleRecord(record.id);
    return true;
}

export async function markScheduleRun(scheduleId: string, range: ScheduleRange): Promise<void> {
    const record = await getScheduleRecord(scheduleId);
    if (!record) return;
    const nextRunAt = new Date(Date.parse(range.end) + record.intervalMs).toISOString();
    await upsertScheduleRecord(scheduleId, {
        lastRunAt: range.end,
        lastRange: range,
        nextRunAt,
    });
}

function resolvePayload(candidate: WebhookPayload | undefined, name: string): WebhookPayload {
    if (candidate && isAlertmanagerPayload(candidate)) {
        return candidate;
    }
    return {
        ...DEFAULT_PAYLOAD,
        commonLabels: {
            ...DEFAULT_PAYLOAD.commonLabels,
            alertname: name || DEFAULT_PAYLOAD.commonLabels?.alertname || "Scheduled Incident",
        },
    };
}
export { getScheduleRecord };

