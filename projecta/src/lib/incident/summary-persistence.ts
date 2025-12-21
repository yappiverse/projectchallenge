"use server";

import type { IncidentSummaryResult } from "@/lib/incident/incident-engine";
import type { WebhookPayload } from "@/lib/incident/alertmanager";
import { saveIncidentRecord } from "@/lib/incident/storage";
import { sendIncidentSummaryEmail } from "@/lib/email/resend";
import { sendIncidentToTelegram } from "@/lib/telegram/send";

export async function persistIncidentSummary(payload: WebhookPayload, result: IncidentSummaryResult) {
    console.log("\n===== INCIDENT SUMMARY =====\n");
    console.log(result.summaryText);
    console.log("\n============================\n");

    await saveIncidentRecord({
        payload,
        summaryText: result.summaryText,
        prompt: result.prompt,
        normalizedLogs: result.logs,
        rawLogs: result.rawLogs,
        geminiResponse: result.geminiResponse,
    });

    await maybeSendEmail(payload, result.summaryText);
    await maybeSendTelegram(payload, result.summaryText);
}

async function maybeSendEmail(payload: WebhookPayload, summaryText: string) {
    const recipient = process.env.INCIDENT_SUMMARY_TO ?? process.env.RESEND_TO;
    if (!recipient) {
        console.warn("[webhook] INCIDENT_SUMMARY_TO not set; skipping email");
        return;
    }

    const subject = `Incident: ${payload.commonLabels?.alertname ?? "Alert"}`;
    try {
        await sendIncidentSummaryEmail(recipient, subject, summaryText);
    } catch (error) {
        console.error("[webhook] error sending incident email", error);
    }
}

async function maybeSendTelegram(payload: WebhookPayload, summaryText: string) {
    const telegramToken = process.env.TELEGRAM_BOT_TOKEN;
    const telegramChat = process.env.TELEGRAM_CHAT_ID ?? process.env.TELEGRAM_CHAT;
    if (!telegramToken || !telegramChat) {
        console.warn("[webhook] TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID not set; skipping telegram");
        return;
    }

    const subject = `Incident: ${payload.commonLabels?.alertname ?? "Alert"}`;
    try {
        await sendIncidentToTelegram(telegramToken, telegramChat, subject, summaryText);
    } catch (error) {
        console.error("[webhook] error sending telegram message", error);
    }
}
