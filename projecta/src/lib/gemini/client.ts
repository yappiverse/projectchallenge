import { geminiConfig } from "@/lib/env";

export interface GeminiResponsePart {
    text?: string;
}

export interface GeminiResponseContent {
    parts?: GeminiResponsePart[];
}

export interface GeminiResponseCandidate {
    content?: GeminiResponseContent;
}

export interface GeminiResponse {
    candidates?: GeminiResponseCandidate[];
}

export interface GeminiClientOptions {
    minIntervalMs?: number;
    skipRateLimit?: boolean;
}

let lastGeminiCall = 0;

export async function requestGeminiSummary(
    prompt: string,
    options: GeminiClientOptions = {},
): Promise<GeminiResponse | null> {
    "use server";
    const minIntervalMs = options.minIntervalMs ?? geminiConfig.minCallGapMs;
    const shouldRateLimit = !options.skipRateLimit;

    if (
        shouldRateLimit &&
        lastGeminiCall &&
        Date.now() - lastGeminiCall < minIntervalMs
    ) {
        console.warn("[gemini] skipped (local rate limit)");
        return null;
    }

    lastGeminiCall = Date.now();

    const response = await fetch(geminiConfig.url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "X-goog-api-key": geminiConfig.apiKey,
        },
        body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
        }),
    });

    if (!response.ok) {
        const text = await response.text();
        throw new Error(`[Gemini] ${response.status}: ${text.slice(0, 200)}`);
    }

    return response.json();
}

export function extractGeminiText(resp: GeminiResponse | null): string {
    if (!resp) return "N/A (Gemini skipped)";
    const candidate = resp.candidates?.[0];
    const joined = candidate?.content?.parts
        ?.map((part) => part.text ?? "")
        .join("");
    return joined?.trim() ? joined : JSON.stringify(resp);
}
