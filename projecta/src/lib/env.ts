const requireEnv = (key: string): string => {
    const value = process.env[key];
    if (!value) {
        throw new Error(`Missing required env variable: ${key}`);
    }
    return value;
};

const parseNumberEnv = (value: string | undefined, fallback: number) => {
    if (!value) return fallback;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
};

export const signozConfig = {
    baseUrl: process.env.SIGNOZ_BASE_URL ?? "http://localhost:8080",
    apiKey: requireEnv("SIGNOZ_API_KEY"),
    queryRangePath: "/api/v5/query_range",
};

export const geminiConfig = {
    url:
        process.env.GEMINI_URL ??
        "https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent",
    apiKey: requireEnv("GEMINI_API_KEY"),
    minCallGapMs: parseNumberEnv(process.env.GEMINI_MIN_CALL_GAP_MS, 30_000),
};

export const mongoConfig = {
    uri: process.env.MONGODB_URI ?? "mongodb://127.0.0.1:27017/projecta",
    dbName: process.env.MONGODB_DB ?? "projecta",
    incidentsCollection: process.env.MONGODB_INCIDENTS_COLLECTION ?? "incident_summaries",
};
