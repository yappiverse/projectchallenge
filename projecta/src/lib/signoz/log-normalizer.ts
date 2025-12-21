import type { NormalizedLog, SigNozLogRow } from "@/lib/signoz/types";

export interface NormalizeLogsOptions {
    maxEntries?: number;
    dedupe?: boolean;
}

const DEFAULT_MAX_ENTRIES = 10000;

export function normalizeLogsForLLM(
    rows: SigNozLogRow[],
    options: NormalizeLogsOptions = {},
): NormalizedLog[] {
    const maxEntries = options.maxEntries ?? DEFAULT_MAX_ENTRIES;
    const dedupe = options.dedupe ?? false;
    const seen = new Set<string>();
    const normalized: NormalizedLog[] = [];

    for (const row of rows) {
        if (!row) continue;
        const attrs = row.data?.attributes_string ?? {};
        const resources = row.data?.resources_string ?? {};
        const message = coerceString(
            row.body,
            row.data?.body,
            attrs["log.message"],
            attrs["message"],
        ) ?? "";
        const severity = coerceString(
            row.severity_text,
            row.data?.severity_text,
            attrs["severity_text"],
            attrs["log.level"],
        );
        const traceId = coerceString(
            attrs["traceId"],
            attrs["trace_id"],
            row.trace_id,
            row.data?.trace_id,
        );
        const spanId = coerceString(
            attrs["spanId"],
            attrs["span_id"],
            row.span_id,
            row.data?.span_id,
        );
        const serviceName = coerceString(
            attrs["service.name"],
            resources["service.name"],
            row.data?.scope_name,
            row.data?.scope_string?.["service.name"],
            attrs["service"],
        );
        const dedupKey = `${message}|${attrs["error.message"]}|${attrs["gateway"]}|${attrs["db_host"]}`;

        if (dedupe) {
            if (seen.has(dedupKey)) continue;
            seen.add(dedupKey);
        }

        normalized.push({
            timestamp: row.timestamp,
            service: serviceName,
            severity,
            message,
            error_message: attrs["error.message"],
            error_name: attrs["error.name"],
            gateway: attrs["gateway"],
            db_host: attrs["db_host"],
            trace_id: traceId,
            span_id: spanId,
            transaction_id: attrs["transactionId"],
        });

        if (normalized.length >= maxEntries) {
            break;
        }
    }

    return normalized;
}

function coerceString(...values: Array<unknown>): string | undefined {
    for (const value of values) {
        if (value === undefined || value === null) continue;
        if (typeof value === "string" && value.length > 0) {
            return value;
        }
        if (typeof value === "number" && Number.isFinite(value)) {
            return String(value);
        }
        if (typeof value === "boolean") {
            return value ? "true" : "false";
        }
    }
    return undefined;
}
