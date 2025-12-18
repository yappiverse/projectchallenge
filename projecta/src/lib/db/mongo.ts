import { MongoClient, type Collection, type Document } from "mongodb";

import { mongoConfig } from "@/lib/env";

interface MongoCache {
    clientPromise?: Promise<MongoClient>;
}

declare global {
    var __projectaMongoCache: MongoCache | undefined;
}

const globalCache = globalThis.__projectaMongoCache ?? {};
if (!globalThis.__projectaMongoCache) {
    globalThis.__projectaMongoCache = globalCache;
}

async function createClient(): Promise<MongoClient> {
    const client = new MongoClient(mongoConfig.uri, {
        maxPoolSize: 20,
    });
    return client.connect();
}

export async function getMongoClient(): Promise<MongoClient> {
    if (!globalCache.clientPromise) {
        globalCache.clientPromise = createClient().catch((err) => {
            globalCache.clientPromise = undefined;
            throw err;
        });
    }
    return globalCache.clientPromise;
}

export async function getCollection<T extends Document>(collectionName: string): Promise<Collection<T>> {
    const client = await getMongoClient();
    return client.db(mongoConfig.dbName).collection<T>(collectionName);
}
