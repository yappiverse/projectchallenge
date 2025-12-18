"use server";

import { signozConfig } from "@/lib/env";
import type { SigNozLogRow } from "@/lib/signoz/types";

export interface LogQueryOptions {
    durationMinutes?: number;
    start?: number;
    end?: number;
    limit?: number;
    offset?: number;
    requestType?: string;
    builderQueryOverrides?: Record<string, unknown>;
}

const MS_IN_MINUTE = 60 * 1000;

export async function fetchSigNozLogs(options: LogQueryOptions = {}): Promise<SigNozLogRow[]> {
    const end = options.end ?? Date.now();
    const durationMinutes = options.durationMinutes ?? 60;
    const start = options.start ?? end - durationMinutes * MS_IN_MINUTE;
    const requestType = options.requestType ?? "raw";

    const builderSpec = {
        name: "A",
        signal: "logs",
        limit: options.limit ?? 1000,
        offset: options.offset ?? 0,
        disabled: false,
        ...(options.builderQueryOverrides ?? {}),
    };

    const payload = {
        start,
        end,
        requestType,
        compositeQuery: {
            queries: [
                {
                    type: "builder_query",
                    spec: builderSpec,
                },
            ],
        },
    };

    const response = await fetch(`${signozConfig.baseUrl}${signozConfig.queryRangePath}`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "SIGNOZ-API-KEY": signozConfig.apiKey,
        },
        body: JSON.stringify(payload),
    });

    if (!response.ok) {
        const text = await response.text();
        throw new Error(`[SigNoz] ${response.status}: ${text.slice(0, 200)}`);
    }

    const json = await response.json();
    const rows: SigNozLogRow[] = json?.data?.data?.results?.[0]?.rows ?? [];

    return rows;
}
