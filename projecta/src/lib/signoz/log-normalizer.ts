import type { NormalizedLog, SigNozLogRow } from "@/lib/signoz/types";

export interface NormalizeLogsOptions {
    maxEntries?: number;
    dedupe?: boolean;
}

const DEFAULT_MAX_ENTRIES = 10;

export function normalizeLogsForLLM(
    rows: SigNozLogRow[],
    options: NormalizeLogsOptions = {},
): NormalizedLog[] {
    const maxEntries = options.maxEntries ?? DEFAULT_MAX_ENTRIES;
    const dedupe = options.dedupe ?? true;
    const seen = new Set<string>();
    const normalized: NormalizedLog[] = [];

    for (const row of rows) {
        if (!row) continue;
        const attrs = row.data?.attributes_string ?? {};
        const message = row.body ?? "";
        const dedupKey = `${message}|${attrs["error.message"]}|${attrs["gateway"]}|${attrs["db_host"]}`;

        if (dedupe) {
            if (seen.has(dedupKey)) continue;
            seen.add(dedupKey);
        }

        normalized.push({
            timestamp: row.timestamp,
            service: attrs["service.name"],
            severity: row.severity_text,
            message,
            error_message: attrs["error.message"],
            error_name: attrs["error.name"],
            gateway: attrs["gateway"],
            db_host: attrs["db_host"],
            trace_id: attrs["traceId"] || row.trace_id,
            span_id: attrs["spanId"] || row.span_id,
            transaction_id: attrs["transactionId"],
        });

        if (normalized.length >= maxEntries) {
            break;
        }
    }

    return normalized;
}
