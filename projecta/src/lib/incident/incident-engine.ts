"use server";

import type { WebhookPayload } from "@/lib/incident/alertmanager";
import { buildIncidentPrompt, DEFAULT_INCIDENT_TEMPLATE } from "@/lib/incident/prompt-builder";
import { requestGeminiSummary, extractGeminiText, type GeminiClientOptions, type GeminiResponse } from "@/lib/gemini/client";
import { fetchSigNozLogs, type LogQueryOptions } from "@/lib/signoz/logs-service";
import { normalizeLogsForLLM, type NormalizeLogsOptions } from "@/lib/signoz/log-normalizer";
import type { NormalizedLog, SigNozLogRow } from "@/lib/signoz/types";

export interface IncidentTemplateContext {
    payload: WebhookPayload;
    logs: NormalizedLog[];
    rawLogs: SigNozLogRow[];
}

export type IncidentTemplateSource = string | ((context: IncidentTemplateContext) => string);

export interface IncidentEngineOptions {
    logQuery?: LogQueryOptions;
    normalization?: NormalizeLogsOptions;
    template?: IncidentTemplateSource;
    skipGemini?: boolean;
    gemini?: GeminiClientOptions;
}

export interface IncidentSummaryResult {
    prompt: string;
    logs: NormalizedLog[];
    rawLogs: SigNozLogRow[];
    geminiResponse: GeminiResponse | null;
    summaryText: string;
}

export async function generateIncidentSummary(
    payload: WebhookPayload,
    options: IncidentEngineOptions = {},
): Promise<IncidentSummaryResult> {
    const rows = await fetchSigNozLogs({
        ...options.logQuery,
        durationMinutes: options.logQuery?.durationMinutes ?? 5,
    });
    console.log("rows", JSON.stringify(rows, null, 2));
    const normalizedLogs = normalizeLogsForLLM(rows, options.normalization);
    console.log("normalizedLogs", JSON.stringify(normalizedLogs, null, 2));

    const resolvedTemplate =
        typeof options.template === "function"
            ? options.template({ payload, logs: normalizedLogs, rawLogs: rows })
            : options.template ?? DEFAULT_INCIDENT_TEMPLATE;

    const prompt = buildIncidentPrompt({
        labels: payload.commonLabels ?? {},
        annotations: payload.commonAnnotations ?? {},
        alerts: payload.alerts ?? [],
        logs: normalizedLogs,
        template: resolvedTemplate,
    });

    if (normalizedLogs.length === 0) {
        return {
            prompt,
            logs: normalizedLogs,
            rawLogs: rows,
            geminiResponse: null,
            summaryText: "No log",
        };
    }

    const geminiResponse = options.skipGemini
        ? null
        : await requestGeminiSummary(prompt, options.gemini);
    const summaryText = extractGeminiText(geminiResponse);

    return {
        prompt,
        logs: normalizedLogs,
        rawLogs: rows,
        geminiResponse,
        summaryText,
    };
}
