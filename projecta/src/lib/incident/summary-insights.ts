export interface IncidentInsights {
    analysis?: string;
    impact?: string;
    actionItems: string[];
}

const SECTION_ORDER = [
    "🧠 Hasil Analisis:",
    "🔥 Impact Level:",
    "✅ Action Items:",
    "🔍 Trace ID:",
];

export function extractIncidentInsights(summaryText: string | undefined): IncidentInsights {
    if (!summaryText) {
        return { actionItems: [] };
    }

    const analysis = extractSection(summaryText, "🧠 Hasil Analisis:");
    const impact = extractSection(summaryText, "🔥 Impact Level:");
    const actionsBlock = extractSection(summaryText, "✅ Action Items:");

    const actionItems = actionsBlock
        ? actionsBlock
            .split(/\n+/)
            .map((line) => line.trim())
            .map((line) => line.replace(/^[-*\d.\)]+\s*/, "").trim())
            .filter(Boolean)
        : [];

    return {
        analysis: cleanupMultiline(analysis),
        impact: cleanupMultiline(impact),
        actionItems,
    };
}

function extractSection(summary: string, marker: string): string | undefined {
    const start = summary.indexOf(marker);
    if (start === -1) return undefined;
    const afterMarker = start + marker.length;
    let end = summary.length;
    for (const candidate of SECTION_ORDER) {
        if (candidate === marker) continue;
        const idx = summary.indexOf(candidate, afterMarker);
        if (idx !== -1 && idx < end) {
            end = idx;
        }
    }
    return summary.slice(afterMarker, end).trim();
}

function cleanupMultiline(value: string | undefined): string | undefined {
    if (!value) return undefined;
    return value
        .split(/\n+/)
        .map((line) => line.trim())
        .filter(Boolean)
        .join(" ");
}
