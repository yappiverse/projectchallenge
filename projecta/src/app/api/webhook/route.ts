import { NextResponse } from "next/server";
import { context as otelContext, ROOT_CONTEXT } from "@opentelemetry/api";

/* =======================
   ENV
======================= */
const SIGNOZ_BASE = process.env.SIGNOZ_BASE_URL || "http://localhost:8080";
const SIGNOZ_API_KEY = process.env.SIGNOZ_API_KEY!;

const GEMINI_KEY = process.env.GEMINI_API_KEY!;
const GEMINI_URL =
	process.env.GEMINI_URL ||
	"https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent";

/* =======================
   SIGNoZ – LAST 60 MIN LOGS
======================= */
async function fetchLast60MinLogs() {
	const end = Date.now();
	const start = end - 60 * 60 * 1000;

	const body = {
		start,
		end,
		requestType: "raw",
		compositeQuery: {
			queries: [
				{
					type: "builder_query",
					spec: {
						name: "A",
						signal: "logs",
						limit: 1000,
						offset: 0,
						disabled: false,
					},
				},
			],
		},
	};

	const res = await fetch(`${SIGNOZ_BASE}/api/v5/query_range`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			"SIGNOZ-API-KEY": SIGNOZ_API_KEY,
		},
		body: JSON.stringify(body),
	});

	if (!res.ok) {
		const txt = await res.text();
		throw new Error(`SigNoz error ${res.status}: ${txt.slice(0, 200)}`);
	}

	const json = await res.json();

	const rows = json?.data?.data?.results?.[0]?.rows ?? [];

	console.log("[signoz] rows fetched:", rows.length);

	return rows;
}

/* =======================
   NORMALIZE LOGS FOR LLM
======================= */
interface LogRow {
	timestamp?: string;
	body?: string;
	severity_text?: string;
	trace_id?: string;
	span_id?: string;
	data?: {
		attributes_string?: Record<string, string>;
	};
}

interface NormalizedLog {
	timestamp?: string;
	service?: string;
	severity?: string;
	message?: string;
	error_message?: string;
	error_name?: string;
	gateway?: string;
	db_host?: string;
	trace_id?: string;
	span_id?: string;
	transaction_id?: string;
}

function normalizeLogsForLLM(rows: LogRow[]) {
	const seen = new Set<string>();
	const result: NormalizedLog[] = [];

	for (const r of rows) {
		const attrs = r?.data?.attributes_string || {};
		const message = r.body || "";

		const dedupKey =
			message + attrs["error.message"] + attrs["gateway"] + attrs["db_host"];

		if (seen.has(dedupKey)) continue;
		seen.add(dedupKey);

		result.push({
			timestamp: r.timestamp,
			service: attrs["service.name"],
			severity: r.severity_text,
			message,
			error_message: attrs["error.message"],
			error_name: attrs["error.name"],
			gateway: attrs["gateway"],
			db_host: attrs["db_host"],
			trace_id: attrs["traceId"] || r.trace_id,
			span_id: attrs["spanId"] || r.span_id,
			transaction_id: attrs["transactionId"],
		});
	}

	return result.slice(0, 10); // HARD CAP
}

/* =======================
   GEMINI
======================= */
interface GeminiResponse {
	candidates?: Array<{
		content?: {
			parts?: Array<{ text: string }>;
		};
	}>;
}

let lastGeminiCall = 0;

async function callGemini(prompt: string) {
	if (Date.now() - lastGeminiCall < 30_000) {
		console.warn("[gemini] skipped (local rate limit)");
		return null;
	}
	lastGeminiCall = Date.now();

	const res = await fetch(GEMINI_URL, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			"X-goog-api-key": GEMINI_KEY,
		},
		body: JSON.stringify({
			contents: [{ parts: [{ text: prompt }] }],
		}),
	});

	return res.json();
}

function extractGeminiText(resp: GeminiResponse | null): string {
	if (!resp) return "N/A (Gemini skipped)";
	return (
		resp?.candidates?.[0]?.content?.parts?.map((p) => p.text).join("") ||
		JSON.stringify(resp)
	);
}

/* =======================
   WEBHOOK
======================= */
interface Alert {
	labels?: Record<string, string>;
	annotations?: Record<string, string>;
}

interface WebhookPayload {
	test?: boolean;
	alerts?: Array<Alert>;
	receiver?: string;
	commonLabels?: Record<string, string>;
	commonAnnotations?: Record<string, string>;
}

export async function POST(req: Request) {
	let payload: WebhookPayload = {};

	try {
		payload = await req.json();
		console.log("[webhook] payload received");
	} catch {
		return NextResponse.json({ ok: true });
	}

	if (!payload || payload.test === true) {
		return NextResponse.json({ ok: true });
	}

	const isAlertmanager =
		Array.isArray(payload.alerts) || payload.receiver || payload.commonLabels;

	if (!isAlertmanager) {
		return NextResponse.json({ ok: true });
	}

	setTimeout(() => {
		otelContext.with(ROOT_CONTEXT, async () => {
			try {
				const labels = payload.commonLabels || {};
				const annotations = payload.commonAnnotations || {};

				const alertLines =
					payload.alerts?.map(
						(a) =>
							`- ${a.labels?.alertname} | severity=${a.labels?.severity} | ${a.annotations?.summary}`,
					) || [];

				let prompt = `
Signoz Alert received.

Labels:
${JSON.stringify(labels, null, 2)}

Annotations:
${JSON.stringify(annotations, null, 2)}

Alerts:
${alertLines.join("\n")}
`;

				/* --- Fetch & normalize logs --- */
				const rows = await fetchLast60MinLogs();
				console.log("Fetched logs:", rows);
				const normalized = normalizeLogsForLLM(rows);
				console.log("Normalized logs:", normalized);
				if (normalized.length > 0) {
					const logsText = normalized
						.map(
							(l) => `
[${l.severity}] ${l.message}
Service: ${l.service}
Cause: ${l.error_message || "N/A"}
Gateway: ${l.gateway || "N/A"}
DB Host: ${l.db_host || "N/A"}
Trace ID: ${l.trace_id || "N/A"}
Transaction: ${l.transaction_id || "N/A"}
`,
						)
						.join("\n");

					prompt += `
Recent ERROR logs (deduplicated, last 60 minutes):
${logsText}

Use the logs above to determine the REAL root cause.
`;
				}

				/* --- Gemini instruction --- */
				prompt += `
Please produce a concise incident summary following EXACTLY this format
(use 'N/A' when missing):

🚨 ALERT: {Title} 🚨
Service: {service}
🛑 Penyebab Utama: {short cause in Indonesian}
🛠 Analisis Teknis: {technical analysis in Indonesian}
🔥 Impact Level: {color + level and impact}
✅ Action Items:
- {action 1}
- {action 2}
- {action 3}
🔍 Trace ID: {trace id or N/A}

Return ONLY the filled template text.
`;

				const geminiResp = await callGemini(prompt);
				const summary = extractGeminiText(geminiResp);

				console.log("\n===== INCIDENT SUMMARY =====\n");
				console.log(summary);
				console.log("\n============================\n");
			} catch (err) {
				console.error("[webhook] background error", err);
			}
		});
	}, 0);

	return NextResponse.json({ ok: true, message: "alert received" });
}
