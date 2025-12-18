import { NextResponse } from "next/server";

const SIGNOZ_BASE = process.env.SIGNOZ_BASE_URL || "http://localhost:8080";
const SIGNOZ_CUSTOM = process.env.SIGNOZ_LOGS_API;
const GEMINI_KEY = process.env.GEMINI_API_KEY || "";
const GEMINI_URL =
  process.env.GEMINI_URL ||
  "https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent";

async function tryEndpoints(body: any) {
  const candidates: string[] = [];
  if (SIGNOZ_CUSTOM) {
  }
  if (SIGNOZ_CUSTOM) candidates.push(SIGNOZ_CUSTOM);
  candidates.push(`${SIGNOZ_BASE}/api/v2/logs/search`);
  candidates.push(`${SIGNOZ_BASE}/api/v1/logs/search`);
  candidates.push(`${SIGNOZ_BASE}/api/v1/logs/sample`);

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
    } catch (e) {
      // ignore
    }
  }
  throw new Error("No working Signoz logs endpoint found");
}

async function callGemini(promptText: string) {
  const payload = { contents: [{ parts: [{ text: promptText }] }] };
  const res = await fetch(GEMINI_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-goog-api-key": GEMINI_KEY,
    },
    body: JSON.stringify(payload),
  });
  return await res.json();
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
    }
    if (resp.output && Array.isArray(resp.output)) {
      for (const o of resp.output) {
        if (o.content && Array.isArray(o.content))
          return o.content.map((p: any) => p.text || p).join("");
      }
    }
  } catch (e) {}
  return JSON.stringify(resp);
}

export async function POST(req: Request) {
  let body: any = {};
  try {
    body = (await req.json()) || {};
  } catch (e) {}

  const minutes = body.minutes ?? 30;
  const prompt = body.prompt || "Berikan ringkasan log";

  const end = Date.now();
  const start = end - minutes * 60 * 1000;

  try {
    const { url, data } = await tryEndpoints({
      start,
      end,
      query: "",
      limit: 200,
    });
    const logsText = JSON.stringify(data).slice(0, 20000);
    const finalPrompt = `${prompt}\n\nLogs (excerpt):\n${logsText}`;
    const gem = await callGemini(finalPrompt);
    const summary = extractTextFromGemini(gem);
    return NextResponse.json({ ok: true, source: url, summary, raw: gem });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 502 });
  }
}
