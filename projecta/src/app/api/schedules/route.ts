import { NextResponse } from "next/server";

import { createSchedule, listSchedules } from "@/lib/scheduler/service";
import type { ScheduleDefinitionInput, ScheduleDuration, ScheduleAnchor, ScheduleMode } from "@/lib/scheduler/types";
import { ensureSchedulerWorker } from "@/lib/scheduler/worker";
import type { WebhookPayload } from "@/lib/incident/alertmanager";

type DurationInput = Partial<Record<keyof ScheduleDuration, unknown>> | undefined;
type AnchorInput = Partial<Record<keyof ScheduleAnchor, unknown>> | undefined;

interface ScheduleRequestBody {
    name?: unknown;
    mode?: unknown;
    duration?: DurationInput;
    anchor?: AnchorInput;
    windowMinutes?: unknown;
    payload?: unknown;
}

export async function GET() {
    try {
        await ensureSchedulerWorker();
        const schedules = await listSchedules();
        return NextResponse.json({ ok: true, schedules });
    } catch (error) {
        console.error("[schedules] failed to list", error);
        return NextResponse.json({ ok: false, error: "Failed to load schedules" }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const scheduleInput = normalizeScheduleInput(body);
        const schedule = await createSchedule(scheduleInput);
        await ensureSchedulerWorker();
        return NextResponse.json({ ok: true, schedule });
    } catch (error) {
        console.error("[schedules] failed to create", error);
        return NextResponse.json({ ok: false, error: (error as Error).message }, { status: 400 });
    }
}

function normalizeScheduleInput(value: unknown): ScheduleDefinitionInput {
    if (!value || typeof value !== "object") {
        throw new Error("Request body must be a JSON object");
    }

    const input = value as ScheduleRequestBody;
    const mode: ScheduleMode = input.mode === "aligned" ? "aligned" : "relative";
    const duration = normalizeDuration(input.duration);
    const anchor = mode === "aligned" ? normalizeAnchor(input.anchor) : null;

    return {
        name: typeof input.name === "string" && input.name.trim().length > 0 ? input.name.trim() : "Scheduled Incident",
        mode,
        duration,
        anchor,
        windowMinutes: parseWindowMinutes(input.windowMinutes),
        payload: input.payload as WebhookPayload | undefined,
    };
}

function normalizeDuration(candidate: DurationInput): ScheduleDuration {
    const safeNumber = (n: unknown) => {
        const parsed = coerceFiniteNumber(n);
        return parsed === undefined ? 0 : Math.max(0, Math.trunc(parsed));
    };
    return {
        years: safeNumber(candidate?.years),
        months: safeNumber(candidate?.months),
        days: safeNumber(candidate?.days),
        hours: safeNumber(candidate?.hours),
        minutes: safeNumber(candidate?.minutes),
    };
}

function normalizeAnchor(candidate: AnchorInput): ScheduleAnchor {
    const clamp = (n: unknown, max: number) => {
        const parsed = coerceFiniteNumber(n);
        if (parsed === undefined) return 0;
        return Math.min(max, Math.max(0, Math.trunc(parsed)));
    };
    return {
        hour: clamp(candidate?.hour, 23),
        minute: clamp(candidate?.minute, 59),
        second: clamp(candidate?.second, 59),
    };
}

function parseWindowMinutes(value: unknown): number | undefined {
    const parsed = coerceFiniteNumber(value);
    if (parsed === undefined) return undefined;
    return Math.max(1, Math.trunc(parsed));
}

function coerceFiniteNumber(value: unknown): number | undefined {
    if (typeof value === "number" && Number.isFinite(value)) {
        return value;
    }
    if (typeof value === "string" && value.trim().length > 0) {
        const parsed = Number(value);
        if (Number.isFinite(parsed)) {
            return parsed;
        }
    }
    return undefined;
}
