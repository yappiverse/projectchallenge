import { formatAlertLine, type Alert } from "@/lib/incident/alertmanager";
import type { NormalizedLog } from "@/lib/signoz/types";

export const DEFAULT_INCIDENT_TEMPLATE = `
Please produce a concise incident summary following EXACTLY this format
(use 'N/A' when missing):

🚨 ALERT: {Title} 🚨
Service: {service}
🛑 Penyebab Utama: {short cause in Indonesian}
🛠 Analisis Teknis: {technical analysis in Indonesian}
🔥 Impact Level: {color + level and impact}
✅ Action Items:
- {action 1}
- {action 2}
- {action 3}
🔍 Trace ID: {trace id or N/A}

Return ONLY the filled template text.`;

export interface PromptBuilderInput {
    labels?: Record<string, string>;
    annotations?: Record<string, string>;
    alerts?: Alert[];
    logs?: NormalizedLog[];
    template?: string;
}

export function buildIncidentPrompt({
    labels = {},
    annotations = {},
    alerts = [],
    logs = [],
    template = DEFAULT_INCIDENT_TEMPLATE,
}: PromptBuilderInput): string {
    const alertLines = alerts.length
        ? alerts.map((alert) => formatAlertLine(alert)).join("\n")
        : "(none)";

    const header = `Signoz Alert received.\n\nLabels:\n${JSON.stringify(labels, null, 2)}\n\nAnnotations:\n${JSON.stringify(annotations, null, 2)}\n\nAlerts:\n${alertLines}\n`;

    const logsSection = logs.length
        ? `\nRecent logs (deduplicated, most recent first):\n${logs
            .map(
                (log) => `
[${log.severity}] ${log.message}
Service: ${log.service}
Cause: ${log.error_message || "N/A"}
Gateway: ${log.gateway || "N/A"}
DB Host: ${log.db_host || "N/A"}
Trace ID: ${log.trace_id || "N/A"}
Transaction: ${log.transaction_id || "N/A"}
`,
            )
            .join("\n")}\n\nUse the logs above to determine the REAL root cause.\n`
        : "";

    return `${header}${logsSection}\n${template}\n`;
}
