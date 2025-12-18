export interface Alert {
    labels?: Record<string, string>;
    annotations?: Record<string, string>;
}

export interface WebhookPayload {
    test?: boolean;
    alerts?: Alert[];
    receiver?: string;
    commonLabels?: Record<string, string>;
    commonAnnotations?: Record<string, string>;
}

export const isAlertmanagerPayload = (
    value: unknown,
): value is WebhookPayload => {
    if (!value || typeof value !== "object") {
        return false;
    }

    const candidate = value as WebhookPayload;
    return (
        Array.isArray(candidate.alerts) ||
        typeof candidate.receiver === "string" ||
        typeof candidate.commonLabels === "object" ||
        typeof candidate.commonAnnotations === "object"
    );
};

export const formatAlertLine = (alert: Alert): string => {
    const name = alert.labels?.alertname ?? "unknown";
    const severity = alert.labels?.severity ?? "n/a";
    const summary = alert.annotations?.summary ?? "n/a";
    return `- ${name} | severity=${severity} | ${summary}`;
};
