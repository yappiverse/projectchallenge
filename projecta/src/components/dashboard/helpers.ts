import type { IncidentRecord } from "@/lib/incident/storage";

const fullFormatter = new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
});

export const formatDateTime = (iso: string): string => {
    if (!iso) return "Unknown";
    const date = new Date(iso);
    return Number.isNaN(date.getTime()) ? "Unknown" : fullFormatter.format(date);
};

export const timeAgo = (iso: string): string => {
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return "";
    const diffMs = Date.now() - date.getTime();
    const diffMinutes = Math.floor(diffMs / 60000);
    if (diffMinutes < 1) return "baru saja";
    if (diffMinutes < 60) return `${diffMinutes}m lalu`;
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours}j lalu`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}h lalu`;
};

export interface SeverityPalette {
    chip: string;
    chipText: string;
    dot: string;
    glow: string;
    border: string;
    panel: string;
}

const baseChip = "border bg-muted/50";
const baseText = "text-muted-foreground";

const severityPalettes: Record<string, SeverityPalette> = {
    fatal: {
        chip: `${baseChip} border-rose-200/80 bg-rose-50 dark:border-rose-500/30 dark:bg-rose-500/10`,
        chipText: "text-rose-700 dark:text-rose-50",
        dot: "bg-rose-500",
        glow: "ring-1 ring-rose-200/70 dark:ring-rose-500/40",
        border: "border-rose-200/70 dark:border-rose-500/40",
        panel: "from-transparent via-transparent to-transparent",
    },
    error: {
        chip: `${baseChip} border-orange-200/80 bg-orange-50 dark:border-orange-500/30 dark:bg-orange-500/10`,
        chipText: "text-orange-700 dark:text-orange-50",
        dot: "bg-orange-500",
        glow: "ring-1 ring-orange-200/70 dark:ring-orange-500/40",
        border: "border-orange-200/70 dark:border-orange-500/40",
        panel: "from-transparent via-transparent to-transparent",
    },
    warn: {
        chip: `${baseChip} border-amber-200/80 bg-amber-50 dark:border-amber-500/30 dark:bg-amber-500/10`,
        chipText: "text-amber-700 dark:text-amber-50",
        dot: "bg-amber-400",
        glow: "ring-1 ring-amber-200/70 dark:ring-amber-500/40",
        border: "border-amber-200/70 dark:border-amber-500/40",
        panel: "from-transparent via-transparent to-transparent",
    },
    info: {
        chip: `${baseChip} border-sky-200/80 bg-sky-50 dark:border-sky-500/30 dark:bg-sky-500/10`,
        chipText: "text-sky-700 dark:text-sky-50",
        dot: "bg-sky-500",
        glow: "ring-1 ring-sky-200/70 dark:ring-sky-500/40",
        border: "border-sky-200/70 dark:border-sky-500/40",
        panel: "from-transparent via-transparent to-transparent",
    },
    debug: {
        chip: `${baseChip} border-slate-200/80 bg-slate-50 dark:border-slate-500/30 dark:bg-slate-500/10`,
        chipText: "text-slate-700 dark:text-slate-50",
        dot: "bg-slate-500",
        glow: "ring-1 ring-slate-200/70 dark:ring-slate-500/40",
        border: "border-slate-200/70 dark:border-slate-500/40",
        panel: "from-transparent via-transparent to-transparent",
    },
    trace: {
        chip: `${baseChip} border-fuchsia-200/80 bg-fuchsia-50 dark:border-fuchsia-500/30 dark:bg-fuchsia-500/10`,
        chipText: "text-fuchsia-700 dark:text-fuchsia-50",
        dot: "bg-fuchsia-500",
        glow: "ring-1 ring-fuchsia-200/70 dark:ring-fuchsia-500/40",
        border: "border-fuchsia-200/70 dark:border-fuchsia-500/40",
        panel: "from-transparent via-transparent to-transparent",
    },
    scheduler: {
        chip: `${baseChip} border-emerald-200/80 bg-emerald-50 dark:border-emerald-500/30 dark:bg-emerald-500/10`,
        chipText: "text-emerald-700 dark:text-emerald-50",
        dot: "bg-emerald-500",
        glow: "ring-1 ring-emerald-200/70 dark:ring-emerald-500/40",
        border: "border-emerald-200/70 dark:border-emerald-500/40",
        panel: "from-transparent via-transparent to-transparent",
    },
    default: {
        chip: `${baseChip} border-border`,
        chipText: baseText,
        dot: "bg-slate-400 dark:bg-slate-200",
        glow: "ring-1 ring-slate-200/80 dark:ring-slate-500/30",
        border: "border-border",
        panel: "from-transparent via-transparent to-transparent",
    },
};

export const getSeverityPalette = (severity?: string): SeverityPalette => {
    if (!severity) return severityPalettes.default;
    const key = severity.toLowerCase();
    return severityPalettes[key] ?? severityPalettes.default;
};

export type SeverityKey = "fatal" | "error" | "warn" | "info" | "debug" | "trace" | "scheduler";

export const severityLabels: Record<SeverityKey, string> = {
    fatal: "Fatal",
    error: "Error",
    warn: "Warn",
    info: "Info",
    debug: "Debug",
    trace: "Trace",
    scheduler: "Scheduler",
};

const severityAliasMap: Record<string, SeverityKey> = {
    fatal: "fatal",
    crit: "fatal",
    critical: "fatal",
    emergency: "fatal",
    alert: "fatal",
    high: "fatal",
    error: "error",
    err: "error",
    severe: "error",
    failure: "error",
    warn: "warn",
    warning: "warn",
    caution: "warn",
    medium: "warn",
    info: "info",
    informational: "info",
    notice: "info",
    low: "info",
    debug: "debug",
    trace: "trace",
    scheduler: "scheduler",
};

const severityPriority: SeverityKey[] = ["fatal", "error", "warn", "info", "debug", "trace"];

const allSeverityOrder: SeverityKey[] = [...severityPriority, "scheduler"];

const normalizeSeverityToken = (value?: string | null): SeverityKey | undefined => {
    if (!value || typeof value !== "string") return undefined;
    const key = value.trim().toLowerCase();
    if (!key) return undefined;
    return severityAliasMap[key];
};

const deriveSeverityFromLogs = (incident: IncidentRecord): SeverityKey | undefined => {
    const seen = new Set<SeverityKey>();
    for (const log of incident.normalizedLogs ?? []) {
        const mapped = normalizeSeverityToken(log.severity);
        if (mapped) {
            seen.add(mapped);
        }
    }
    for (const key of severityPriority) {
        if (seen.has(key)) {
            return key;
        }
    }
    return undefined;
};

const inferPayloadSeverity = (incident: IncidentRecord): SeverityKey | undefined => {
    const candidate =
        incident.payload?.commonLabels?.severity ??
        incident.payload?.commonAnnotations?.severity ??
        incident.payload?.alerts?.[0]?.labels?.severity ??
        incident.payload?.alerts?.[0]?.annotations?.severity ??
        (typeof incident.payload?.receiver === "string" ? incident.payload.receiver : undefined);

    return normalizeSeverityToken(candidate);
};

export const formatIncidentSeverity = (
    incident: IncidentRecord,
): { primary: SeverityKey; label: string } => {
    const receiver = incident.payload?.receiver?.toLowerCase();
    if (receiver === "scheduler") {
        return { primary: "scheduler", label: severityLabels.scheduler };
    }

    const inferred = inferPayloadSeverity(incident) ?? deriveSeverityFromLogs(incident) ?? "info";

    return { primary: inferred, label: severityLabels[inferred] };
};

export const incidentMatchesSeverity = (incident: IncidentRecord, severity: string): boolean => {
    const normalized = normalizeSeverityToken(severity) ?? "info";
    return formatIncidentSeverity(incident).primary === normalized;
};

export const getIncidentSeveritySpectrum = (incident: IncidentRecord): SeverityKey[] => {
    const spectrum = new Set<SeverityKey>();
    const primary = formatIncidentSeverity(incident).primary;
    spectrum.add(primary);

    for (const log of incident.normalizedLogs ?? []) {
        const mapped = normalizeSeverityToken(log.severity);
        if (mapped) {
            spectrum.add(mapped);
        }
    }

    if (incident.payload?.receiver?.toLowerCase() === "scheduler") {
        spectrum.add("scheduler");
    }

    return allSeverityOrder.filter((key) => spectrum.has(key));
};

export const describeSeverityLabel = (key: SeverityKey): string => severityLabels[key] ?? key;
