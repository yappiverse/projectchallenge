import type { WebhookPayload } from "@/lib/incident/alertmanager";

export type ScheduleMode = "relative" | "aligned";

export interface ScheduleDuration {
    years: number;
    months: number;
    days: number;
    hours: number;
    minutes: number;
}

export interface ScheduleAnchor {
    hour: number;
    minute: number;
    second: number;
}

export interface ScheduleRange {
    start: string;
    end: string;
}

export interface ScheduleDefinitionInput {
    name: string;
    mode: ScheduleMode;
    duration: ScheduleDuration;
    anchor?: ScheduleAnchor | null;
    windowMinutes?: number;
    payload?: WebhookPayload;
}

export interface ScheduleRecord extends ScheduleDefinitionInput {
    id: string;
    anchor: ScheduleAnchor | null;
    intervalMs: number;
    windowMs: number;
    createdAt: string;
    nextRunAt?: string | null;
    lastRunAt?: string | null;
    lastRange?: ScheduleRange | null;
    repeatJobKey?: string;
}

export interface ScheduleJobData {
    scheduleId: string;
    windowMs: number;
    payload: WebhookPayload;
}
