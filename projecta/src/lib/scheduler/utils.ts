import { schedulerConfig } from "@/lib/env";
import type { ScheduleAnchor, ScheduleDuration, ScheduleMode } from "@/lib/scheduler/types";

const MINUTE_MS = 60 * 1000;
const HOUR_MS = MINUTE_MS * 60;
const DAY_MS = HOUR_MS * 24;
const MONTH_MS = DAY_MS * 30;
const YEAR_MS = DAY_MS * 365;

export function normalizeDuration(duration: ScheduleDuration): ScheduleDuration {
    return {
        years: clampInt(duration.years),
        months: clampInt(duration.months),
        days: clampInt(duration.days),
        hours: clampInt(duration.hours),
        minutes: clampInt(duration.minutes),
    };
}

export function durationToMs(duration: ScheduleDuration): number {
    const normalized = normalizeDuration(duration);
    return (
        normalized.years * YEAR_MS +
        normalized.months * MONTH_MS +
        normalized.days * DAY_MS +
        normalized.hours * HOUR_MS +
        normalized.minutes * MINUTE_MS
    );
}

export function ensureMinimumIntervalMs(value: number): number {
    return Math.max(schedulerConfig.minIntervalMs, Math.max(0, Math.trunc(value)));
}

export function normalizeAnchor(anchor?: ScheduleAnchor | null): ScheduleAnchor | null {
    if (!anchor) return null;
    return {
        hour: clampRange(anchor.hour, 0, 23),
        minute: clampRange(anchor.minute, 0, 59),
        second: clampRange(anchor.second, 0, 59),
    };
}

export function computeStartDate(mode: ScheduleMode, duration: ScheduleDuration, anchor?: ScheduleAnchor | null): Date {
    const now = new Date();
    if (mode === "aligned" && anchor) {
        const anchorDate = new Date(now);
        anchorDate.setHours(anchor.hour, anchor.minute, anchor.second, 0);
        if (anchorDate <= now) {
            return addDuration(anchorDate, duration);
        }
        return anchorDate;
    }
    const intervalMs = durationToMs(duration);
    return new Date(now.getTime() + Math.max(intervalMs, schedulerConfig.minIntervalMs));
}

export function addDuration(base: Date, duration: ScheduleDuration): Date {
    const next = new Date(base);
    next.setFullYear(next.getFullYear() + duration.years);
    next.setMonth(next.getMonth() + duration.months);
    next.setDate(next.getDate() + duration.days);
    next.setHours(next.getHours() + duration.hours);
    next.setMinutes(next.getMinutes() + duration.minutes);
    return next;
}

function clampInt(value: number): number {
    if (!Number.isFinite(value)) return 0;
    return Math.max(0, Math.trunc(value));
}

function clampRange(value: number, min: number, max: number): number {
    if (!Number.isFinite(value)) return min;
    return Math.min(max, Math.max(min, Math.trunc(value)));
}
