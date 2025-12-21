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

const sanitizeQueueName = (value: string | undefined) => {
    const fallback = value && value.trim().length > 0 ? value.trim() : "projecta-incident-scheduler";
    return fallback.replace(/[^A-Za-z0-9_-]/g, "-");
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

export const redisConfig = {
    url: process.env.REDIS_URL,
    host: process.env.REDIS_HOST ?? "127.0.0.1",
    port: parseNumberEnv(process.env.REDIS_PORT, 6379),
    username: process.env.REDIS_USERNAME,
    password: process.env.REDIS_PASSWORD,
};

export const schedulerConfig = {
    queueName: sanitizeQueueName(process.env.SCHEDULER_QUEUE_NAME),
    minIntervalMs: parseNumberEnv(process.env.SCHEDULER_MIN_INTERVAL_MS, 60_000),
};
