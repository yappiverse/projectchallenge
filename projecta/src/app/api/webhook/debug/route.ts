import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const headers: Record<string, string> = {};
  for (const [k, v] of req.headers) headers[k] = v;

  let body: any = null;
  try {
    body = await req.json();
  } catch (e) {
    try {
      body = await req.text();
    } catch (e2) {
      body = null;
    }
  }

  console.log("/api/webhook/debug received request", { headers, body });

  return NextResponse.json({ ok: true, headers, body });
}

export async function GET() {
  return NextResponse.json({ ok: true, message: "webhook debug endpoint" });
}
