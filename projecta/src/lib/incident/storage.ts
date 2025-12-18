"use server";

import type { WithId } from "mongodb";

import type { GeminiResponse } from "@/lib/gemini/client";
import type { WebhookPayload } from "@/lib/incident/alertmanager";
import { mongoConfig } from "@/lib/env";
import { getCollection } from "@/lib/db/mongo";
import type { NormalizedLog, SigNozLogRow } from "@/lib/signoz/types";

const MAX_STORED_RAW_LOGS = 200;
let indexesEnsured = false;

async function getIncidentCollection() {
    const collection = await getCollection<IncidentDocument>(mongoConfig.incidentsCollection);
    if (!indexesEnsured) {
        await collection.createIndex({ createdAt: -1 });
        indexesEnsured = true;
    }
    return collection;
}

export interface IncidentInsertInput {
    summaryText: string;
    prompt: string;
    normalizedLogs: NormalizedLog[];
    rawLogs: SigNozLogRow[];
    geminiResponse: GeminiResponse | null;
    payload: WebhookPayload;
}

interface IncidentDocument extends IncidentInsertInput {
    createdAt: Date;
}

export interface IncidentRecord extends IncidentInsertInput {
    id: string;
    createdAt: string;
}

const toRecord = (doc: WithId<IncidentDocument>): IncidentRecord => ({
    id: doc._id.toHexString(),
    createdAt: doc.createdAt.toISOString(),
    summaryText: doc.summaryText,
    prompt: doc.prompt,
    normalizedLogs: doc.normalizedLogs,
    rawLogs: doc.rawLogs,
    geminiResponse: doc.geminiResponse,
    payload: doc.payload,
});

const trimRawLogs = (rawLogs: SigNozLogRow[]): SigNozLogRow[] => {
    if (!Array.isArray(rawLogs)) return [];
    return rawLogs.slice(0, MAX_STORED_RAW_LOGS);
};

export async function saveIncidentRecord(input: IncidentInsertInput): Promise<IncidentRecord> {
    const collection = await getIncidentCollection();
    const doc: IncidentDocument = {
        ...input,
        rawLogs: trimRawLogs(input.rawLogs),
        createdAt: new Date(),
    };
    const result = await collection.insertOne(doc);
    return toRecord({ ...doc, _id: result.insertedId } as WithId<IncidentDocument>);
}

export async function listIncidentRecords(limit = 20): Promise<IncidentRecord[]> {
    const collection = await getIncidentCollection();
    const docs = await collection
        .find()
        .sort({ createdAt: -1 })
        .limit(Math.max(1, Math.min(limit, 100)))
        .toArray();
    return docs.map((doc) => toRecord(doc as WithId<IncidentDocument>));
}
