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

const baseChip = "border border-white/15 bg-transparent";
const baseText = "text-slate-100";

const severityPalettes: Record<string, SeverityPalette> = {
    fatal: {
        chip: baseChip,
        chipText: baseText,
        dot: "bg-rose-200",
        glow: "ring-1 ring-white/10",
        border: "border-white/15",
        panel: "from-transparent via-transparent to-transparent",
    },
    error: {
        chip: baseChip,
        chipText: baseText,
        dot: "bg-orange-200",
        glow: "ring-1 ring-white/10",
        border: "border-white/15",
        panel: "from-transparent via-transparent to-transparent",
    },
    warn: {
        chip: baseChip,
        chipText: baseText,
        dot: "bg-amber-200",
        glow: "ring-1 ring-white/10",
        border: "border-white/15",
        panel: "from-transparent via-transparent to-transparent",
    },
    info: {
        chip: baseChip,
        chipText: baseText,
        dot: "bg-cyan-200",
        glow: "ring-1 ring-white/10",
        border: "border-white/15",
        panel: "from-transparent via-transparent to-transparent",
    },
    debug: {
        chip: baseChip,
        chipText: baseText,
        dot: "bg-slate-300",
        glow: "ring-1 ring-white/10",
        border: "border-white/15",
        panel: "from-transparent via-transparent to-transparent",
    },
    trace: {
        chip: baseChip,
        chipText: baseText,
        dot: "bg-fuchsia-200",
        glow: "ring-1 ring-white/10",
        border: "border-white/15",
        panel: "from-transparent via-transparent to-transparent",
    },
    default: {
        chip: baseChip,
        chipText: baseText,
        dot: "bg-slate-200",
        glow: "ring-1 ring-white/10",
        border: "border-white/15",
        panel: "from-transparent via-transparent to-transparent",
    },
};

export const getSeverityPalette = (severity?: string): SeverityPalette => {
    if (!severity) return severityPalettes.default;
    const key = severity.toLowerCase();
    return severityPalettes[key] ?? severityPalettes.default;
};
