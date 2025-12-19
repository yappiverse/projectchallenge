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
