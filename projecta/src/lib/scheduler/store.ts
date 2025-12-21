import { getRedisClient } from "@/lib/redis/client";
import type { ScheduleRecord } from "@/lib/scheduler/types";

const SCHEDULE_HASH = "projecta:schedules";

export async function saveScheduleRecord(record: ScheduleRecord): Promise<void> {
    const redis = getRedisClient();
    await redis.hset(SCHEDULE_HASH, record.id, JSON.stringify(record));
}

export async function getScheduleRecord(id: string): Promise<ScheduleRecord | null> {
    const redis = getRedisClient();
    const raw = await redis.hget(SCHEDULE_HASH, id);
    if (!raw) return null;
    try {
        return JSON.parse(raw) as ScheduleRecord;
    } catch (error) {
        console.error(`[scheduler] failed to parse schedule ${id}`, error);
        return null;
    }
}

export async function deleteScheduleRecord(id: string): Promise<void> {
    const redis = getRedisClient();
    await redis.hdel(SCHEDULE_HASH, id);
}

export async function listScheduleRecords(): Promise<ScheduleRecord[]> {
    const redis = getRedisClient();
    const raw = await redis.hgetall(SCHEDULE_HASH);
    return Object.values(raw).flatMap((value) => {
        try {
            return [JSON.parse(value) as ScheduleRecord];
        } catch (error) {
            console.error("[scheduler] failed to parse schedule", error);
            return [];
        }
    });
}

export async function upsertScheduleRecord(id: string, patch: Partial<ScheduleRecord>): Promise<ScheduleRecord | null> {
    const current = await getScheduleRecord(id);
    if (!current) {
        return null;
    }
    const next: ScheduleRecord = { ...current, ...patch };
    await saveScheduleRecord(next);
    return next;
}
