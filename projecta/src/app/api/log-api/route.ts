import { NextResponse } from "next/server";

const SIGNOZ_BASE = process.env.SIGNOZ_BASE_URL || "http://localhost:8080";
const SIGNOZ_CUSTOM = process.env.SIGNOZ_LOGS_API; // optional full path override

async function tryEndpoints(body: any) {
  const candidates = [];
  if (SIGNOZ_CUSTOM) candidates.push(SIGNOZ_CUSTOM);
  candidates.push(`${SIGNOZ_BASE}/api/v1/logs/search`);
  candidates.push(`${SIGNOZ_BASE}/api/v1/search/logs`);
  candidates.push(`${SIGNOZ_BASE}/api/v1/search/query`);
  candidates.push(`${SIGNOZ_BASE}/api/v1/logs`);

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

      // If we got HTML (Signoz UI) or other content, skip and try next
      if (res.ok) {
        console.warn(
          `[log-api] Skipping ${url} — status=${res.status} content-type=${ct}`
        );
      }

      // fallthrough if 404/405 etc — try GET with query params
      if (res.status === 404 || res.status === 405) {
        const q = new URL(url);
        Object.entries(body || {}).forEach(([k, v]) =>
          q.searchParams.set(k, String(v))
        );
        const res2 = await fetch(q.toString());
        const ct2 = res2.headers.get("content-type") || "";
        if (res2.ok && ct2.includes("application/json"))
          return { url: q.toString(), data: await res2.json() };
        if (res2.ok)
          console.warn(
            `[log-api] Skipping ${q.toString()} — status=${
              res2.status
            } content-type=${ct2}`
          );
      }
    } catch (e) {
      console.warn(`[log-api] request failed for ${url}: ${String(e)}`);
      // try next
    }
  }
  throw new Error(
    "No working Signoz logs endpoint found (set SIGNOZ_LOGS_API to a valid endpoint)"
  );
}

export async function GET() {
  // last 1 hour
  const end = Date.now();
  const start = end - 1000 * 60 * 60;

  // severity < WARN (i.e., TRACE/DEBUG/INFO) — represent as comparator and value
  const body = {
    start,
    end,
    severityComparator: "<",
    severity: "WARN",
    // limit: 200,
  };

  try {
    const { url, data } = await tryEndpoints(body);
    return NextResponse.json({ ok: true, source: url, data });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: String(err) },
      { status: 502 }
    );
  }
}
