import { NextResponse } from "next/server";
import { context as otelContext, ROOT_CONTEXT } from "@opentelemetry/api";

const SIGNOZ_BASE = process.env.SIGNOZ_BASE_URL || "http://localhost:8080";
const SIGNOZ_CUSTOM = process.env.SIGNOZ_LOGS_API;
const GEMINI_KEY =
  process.env.GEMINI_API_KEY || "AIzaSyA4v0yzGkyjLlhTfU9UAHRsF38lz44hbds";
const GEMINI_URL =
  process.env.GEMINI_URL ||
  "https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent";

async function tryEndpoints(body: any) {
  const candidates = [];

  // Custom override
  if (SIGNOZ_CUSTOM) candidates.push(SIGNOZ_CUSTOM);

  // SigNoz v1 ONLY
  candidates.push(`${SIGNOZ_BASE}/api/v1/logs/search`);
  candidates.push(`${SIGNOZ_BASE}/api/v1/logs/sample`);
  candidates.push(`${SIGNOZ_BASE}/api/v1/query-range`);

  for (const url of candidates) {
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const ct = res.headers.get("content-type") || "";

      if (res.ok && ct.includes("application/json")) {
        return { url, data: await res.json() };
      }

      console.warn(
        `[webhook] Skipping ${url} — status=${res.status} content-type=${ct}`
      );
    } catch (e) {
      console.warn(`[webhook] request failed for ${url}: ${String(e)}`);
    }
  }

  throw new Error(
    "No working Signoz logs endpoint found (set SIGNOZ_LOGS_API to a valid endpoint)"
  );
}

async function callGemini(promptText: string) {
  const payload = {
    contents: [
      {
        parts: [
          {
            text: promptText,
          },
        ],
      },
    ],
  };

  const res = await fetch(GEMINI_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-goog-api-key": GEMINI_KEY,
    },
    body: JSON.stringify(payload),
  });
  const json = await res.json();
  // log full response for now
  console.log("[Gemini response]", JSON.stringify(json, null, 2));
  return json;
}

function extractTextFromGemini(resp: any): string {
  if (!resp) return "";
  if (typeof resp === "string") return resp;
  try {
    if (resp.candidates && resp.candidates[0]) {
      const c = resp.candidates[0];
      if (c.content) {
        if (Array.isArray(c.content))
          return c.content.map((p: any) => p.text || p).join("");
        if (typeof c.content === "string") return c.content;
      }
      if (c.message && c.message.content) {
        const parts = c.message.content;
        if (Array.isArray(parts))
          return parts.map((p: any) => p.text || p).join("");
      }
    }
    if (resp.output && Array.isArray(resp.output)) {
      for (const o of resp.output) {
        if (o.content && Array.isArray(o.content)) {
          const txts = o.content.map((p: any) => p.text || p).filter(Boolean);
          if (txts.length) return txts.join("");
        }
      }
    }
    if (resp.result && resp.result.output) return String(resp.result.output);
  } catch (e) {
    // ignore
  }
  return JSON.stringify(resp);
}

export async function POST(req: Request) {
  // allow optional body to customize time window; default: last 1 hour
  let bodyReq: any = {};
  try {
    bodyReq = (await req.json()) || {};
  } catch (e) {
    bodyReq = {};
  }

  // Heuristics: if this looks like a Signoz "test connection" ping, reply 200 quickly.
  const isTestHeader =
    req.headers.get("x-signoz-test") || req.headers.get("x-test");
  const looksLikeTest =
    isTestHeader ||
    bodyReq?.test === true ||
    bodyReq?.isTest === true ||
    bodyReq?.type === "test" ||
    bodyReq?.event === "test_connection" ||
    Object.keys(bodyReq || {}).length === 0;
  if (looksLikeTest) {
    console.log(
      "/api/webhook: received test connection ping from Signoz (or empty body) — returning 200"
    );
    return NextResponse.json({ ok: true, message: "test connection received" });
  }

  // Detect Alertmanager-style payload (Signoz sends alerts in this format)
  const isAlertmanager =
    bodyReq &&
    (Array.isArray(bodyReq.alerts) ||
      bodyReq.receiver ||
      bodyReq.commonAnnotations ||
      bodyReq.commonLabels);
  if (isAlertmanager) {
    // Immediately acknowledge to Signoz so Test Connection/alert delivery succeeds
    console.log(
      "/api/webhook: received alertmanager payload — acknowledging immediately and processing in background"
    );

    // Fire-and-forget processing so Signoz gets quick 200
    (function scheduleProcessAlert(payload: any) {
      const task = async () => {
        try {
          const receiver = payload.receiver;
          const status = payload.status;
          const common = payload.commonAnnotations || {};
          const labels = payload.commonLabels || {};

          const alertSummaries: string[] = [];
          if (Array.isArray(payload.alerts)) {
            for (const a of payload.alerts) {
              const lbls = a.labels || {};
              const anns = a.annotations || {};
              alertSummaries.push(
                `- alert: ${lbls.alertname || "(unknown)"} severity=${
                  lbls.severity || labels.severity || "(n/a)"
                } summary=${
                  anns.summary || anns.message || common.summary || "(none)"
                }`
              );
            }
          }

          let promptBase = `Signoz Alert received. receiver=${receiver} status=${status} labels=${JSON.stringify(
            labels
          )} annotations=${JSON.stringify(
            common
          )}\n\nAlerts:\n${alertSummaries.join("\n")}`;

          const templateInstruction = `\n\nPlease produce a concise incident summary following EXACTLY this format (use 'N/A' when a field is not available):\n\n🚨 ALERT: {Title} 🚨\nService: {service} {optional extra like Order ID: ...}\n🛑 Penyebab Utama: {short cause in Indonesian}\n🛠 Analisis Teknis: {technical analysis in Indonesian}\n🔥 Impact Level: {color + level and short impact statement}\n✅ Action Items:\n- {action 1}\n- {action 2}\n- {action 3}\n🔍 Trace ID: {trace id or N/A}\n\nReturn ONLY the filled template text (no surrounding explanation).`;

          let prompt = promptBase + templateInstruction;

          // Optionally fetch last 1 hour logs from configured SIGNOZ_LOGS_API to enrich the prompt
          if (SIGNOZ_CUSTOM) {
            try {
              const end = Date.now();
              const start = end - 1000 * 60 * 60;
              const resp = await fetch(SIGNOZ_CUSTOM, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ start, end, query: "", limit: 200 }),
              });
              const ct = resp.headers.get("content-type") || "";
              if (resp.ok && ct.includes("application/json")) {
                const logsJson = await resp.json();
                const logsText = JSON.stringify(logsJson).slice(0, 20000);
                prompt += `\n\nRecent logs (1h) excerpt:\n${logsText}`;
              } else {
                console.warn(
                  "/api/webhook: SIGNOZ_LOGS_API responded but not JSON or failed – skipping logs enrichment",
                  { status: resp.status, contentType: ct }
                );
              }
            } catch (e) {
              console.warn(
                "/api/webhook: failed to fetch logs from SIGNOZ_LOGS_API",
                String(e)
              );
            }
          }

          // Call Gemini and log response (expecting the filled template text)
          const geminiResp = await callGemini(prompt);
          const summaryText = extractTextFromGemini(geminiResp);
          console.log(
            "/api/webhook: Gemini formatted summary:\n" + summaryText
          );
        } catch (e) {
          console.error(
            "/api/webhook: error processing alert in background",
            String(e)
          );
        }
      };

      // schedule on next tick but detach from current OTEL context to avoid "ended span" errors
      setTimeout(() => {
        try {
          otelContext.with(ROOT_CONTEXT, () => {
            task().catch((e) => console.error("background process failed", e));
          });
        } catch (e) {
          // fallback: just run the task
          task().catch((err) =>
            console.error("background process failed", err)
          );
        }
      }, 0);
    })(bodyReq);

    return NextResponse.json({ ok: true, message: "alert received" });
  }

  const end = Date.now();
  const start =
    end - (bodyReq.minutes ? bodyReq.minutes * 60000 : 1000 * 60 * 60);

  const body = {
    start,
    end,
    severityComparator: ">",
    severity: "WARN",
    // limit: bodyReq.limit || 200,
  };

  try {
    const { url, data } = await tryEndpoints(body);

    // flatten logs into text
    const logsText = (() => {
      try {
        if (Array.isArray(data))
          return data.map((d: any) => JSON.stringify(d)).join("\n\n");
        // try common shapes
        if (data?.data) return JSON.stringify(data.data);
        return JSON.stringify(data);
      } catch (e) {
        return String(data);
      }
    })();

    const templateInstruction = `\n\nPlease produce a concise incident summary following EXACTLY this format (use 'N/A' when a field is not available):\n\n🚨 ALERT: {Title} 🚨\nService: {service} {optional extra like Order ID: ...}\n🛑 Penyebab Utama: {short cause in Indonesian}\n🛠 Analisis Teknis: {technical analysis in Indonesian}\n🔥 Impact Level: {color + level and short impact statement}\n✅ Action Items:\n- {action 1}\n- {action 2}\n- {action 3}\n🔍 Trace ID: {trace id or N/A}\n\nReturn ONLY the filled template text (no surrounding explanation).`;

    const prompt =
      `Summarize the following logs and give a short list of actions (1-3) to investigate or mitigate.\n\n${logsText}` +
      templateInstruction;

    const geminiResp = await callGemini(prompt);
    const summaryText = extractTextFromGemini(geminiResp);

    return NextResponse.json({
      ok: true,
      source: url,
      summary: summaryText,
      raw: geminiResp,
    });
  } catch (err: any) {
    console.error("/api/webhook error:", err);
    return NextResponse.json(
      { ok: false, error: String(err) },
      { status: 502 }
    );
  }
}
