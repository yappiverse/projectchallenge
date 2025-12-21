import { NextResponse } from "next/server";

import { isAlertmanagerPayload, type WebhookPayload } from "@/lib/incident/alertmanager";
import { generateIncidentSummary } from "@/lib/incident/incident-engine";
import { persistIncidentSummary } from "@/lib/incident/summary-persistence";
import { getScheduleRecord } from "@/lib/scheduler/service";

type ExecuteScheduleRequest = {
    start?: number | string;
    end?: number | string;
    persist?: boolean;
    logQuery?: {
        builderQueryOverrides?: Record<string, unknown>;
    };
    scheduleId?: string;
    payload?: unknown;
    name?: string;
    summary?: string;
};

export async function POST(request: Request) {
    try {
        const body = (await request.json()) as ExecuteScheduleRequest;
        const { start, end } = parseRange(body);
        const payload = await resolvePayload(body);

        const result = await generateIncidentSummary(payload, {
            logQuery: {
                start,
                end,
                builderQueryOverrides: body?.logQuery?.builderQueryOverrides,
            },
        });

        if (body?.persist !== false) {
            await persistIncidentSummary(payload, result);
        }

        return NextResponse.json({
            ok: true,
            summary: result.summaryText,
            prompt: result.prompt,
            range: {
                start: new Date(start).toISOString(),
                end: new Date(end).toISOString(),
            },
            normalizedLogs: result.logs,
        });
    } catch (error) {
        console.error("[schedules/execute] failed", error);
        return NextResponse.json({ ok: false, error: (error as Error).message }, { status: 400 });
    }
}

function parseRange(body: ExecuteScheduleRequest) {
    const start = parseTimestamp(body?.start);
    const end = parseTimestamp(body?.end);
    if (!Number.isFinite(start) || !Number.isFinite(end) || start >= end) {
        throw new Error("Invalid start/end range");
    }
    return { start, end };
}

function parseTimestamp(value: unknown): number {
    if (typeof value === "number" && Number.isFinite(value)) {
        return Math.trunc(value);
    }
    if (typeof value === "string" && value.length > 0) {
        const parsed = Date.parse(value);
        if (Number.isFinite(parsed)) {
            return parsed;
        }
    }
    return NaN;
}

async function resolvePayload(body: ExecuteScheduleRequest): Promise<WebhookPayload> {
    if (body?.scheduleId) {
        const schedule = await getScheduleRecord(body.scheduleId);
        if (!schedule?.payload) {
            throw new Error("Schedule payload missing");
        }
        return schedule.payload;
    }

    if (isAlertmanagerPayload(body?.payload)) {
        return body.payload;
    }

    const manualPayload: WebhookPayload & { status: "firing" } = {
        receiver: "scheduler",
        status: "firing",
        alerts: [],
        commonLabels: { alertname: body?.name ?? "Ad-hoc Incident" },
        commonAnnotations: { summary: body?.summary ?? "Manual incident execution" },
    };

    return manualPayload;
}
