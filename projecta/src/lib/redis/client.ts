import Redis, { type RedisOptions } from "ioredis";

import { redisConfig } from "@/lib/env";

interface RedisInstanceCache {
    client?: Redis;
}

declare global {
    var __projectaRedisCache: RedisInstanceCache | undefined;
}

const globalCache = globalThis.__projectaRedisCache ?? {};
if (!globalThis.__projectaRedisCache) {
    globalThis.__projectaRedisCache = globalCache;
}

interface ResolvedRedisOptions extends RedisOptions {
    url?: string;
}

function buildOptions(): ResolvedRedisOptions {
    const options: ResolvedRedisOptions = {
        maxRetriesPerRequest: null,
    };

    if (redisConfig.url) {
        options.url = redisConfig.url;
        return options;
    }

    options.host = redisConfig.host;
    options.port = redisConfig.port;

    if (redisConfig.username) {
        options.username = redisConfig.username;
    }

    if (redisConfig.password) {
        options.password = redisConfig.password;
    }

    return options;
}

function instantiateRedis(): Redis {
    const options = buildOptions();
    const instance = options.url
        ? (() => {
            const { url, ...rest } = options;
            return new Redis(url, rest);
        })()
        : new Redis(options);
    instance.on("error", (err) => {
        console.error("[redis] connection error", err);
    });
    return instance;
}

export function getRedisClient(): Redis {
    if (!globalCache.client) {
        globalCache.client = instantiateRedis();
    }
    return globalCache.client;
}

export function createRedisConnection(): Redis {
    return instantiateRedis();
}
