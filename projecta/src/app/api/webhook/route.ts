import { NextResponse } from "next/server";
import { context as otelContext, ROOT_CONTEXT } from "@opentelemetry/api";

import { generateIncidentSummary } from "@/lib/incident/incident-engine";
import { isAlertmanagerPayload, type WebhookPayload } from "@/lib/incident/alertmanager";
import { saveIncidentRecord } from "@/lib/incident/storage";

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
			} catch (err) {
				console.error("[webhook] background error", err);
			}
		});
	}, 0);

	return NextResponse.json({ ok: true, message: "alert received" });
}
