import { NextResponse } from "next/server";
import { context as otelContext, ROOT_CONTEXT } from "@opentelemetry/api";

import { generateIncidentSummary } from "@/lib/incident/incident-engine";
import {
  isAlertmanagerPayload,
  type WebhookPayload,
} from "@/lib/incident/alertmanager";
import { saveIncidentRecord } from "@/lib/incident/storage";
import { sendIncidentSummaryEmail } from "@/lib/email/resend";
import { sendIncidentToTelegram } from "@/lib/telegram/send";

export async function POST(req: Request) {
  let body: unknown;

  try {
    body = await req.json();
    console.log("[webhook] payload received");
  } catch {
    return NextResponse.json({ ok: true });
  }

  if (!isAlertmanagerPayload(body)) {
    return NextResponse.json({ ok: true });
  }

  if (body.test) {
    return NextResponse.json({ ok: true });
  }

  const payload: WebhookPayload = body;
  console.log("payload", JSON.stringify(payload, null, 2));

  setTimeout(() => {
    otelContext.with(ROOT_CONTEXT, async () => {
      try {
        const result = await generateIncidentSummary(payload);
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

        // Send incident summary email if recipient is configured
        const recipient =
          process.env.INCIDENT_SUMMARY_TO ?? process.env.RESEND_TO;
        if (recipient) {
          const subject = `Incident: ${
            payload.commonLabels?.alertname ?? "Alert"
          }`;
          try {
            await sendIncidentSummaryEmail(
              recipient,
              subject,
              result.summaryText
            );
          } catch (err) {
            console.error("[webhook] error sending incident email", err);
          }
        } else {
          console.warn("[webhook] INCIDENT_SUMMARY_TO not set; skipping email");
        }

        // Send incident summary to Telegram if configured
        const telegramToken = process.env.TELEGRAM_BOT_TOKEN;
        const telegramChat =
          process.env.TELEGRAM_CHAT_ID ?? process.env.TELEGRAM_CHAT;
        if (telegramToken && telegramChat) {
          const subject = `Incident: ${
            payload.commonLabels?.alertname ?? "Alert"
          }`;
          try {
            await sendIncidentToTelegram(
              telegramToken,
              telegramChat,
              subject,
              result.summaryText
            );
          } catch (err) {
            console.error("[webhook] error sending telegram message", err);
          }
        } else {
          console.warn(
            "[webhook] TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID not set; skipping telegram"
          );
        }
      } catch (err) {
        console.error("[webhook] background error", err);
      }
    });
  }, 0);

  return NextResponse.json({ ok: true, message: "alert received" });
}
