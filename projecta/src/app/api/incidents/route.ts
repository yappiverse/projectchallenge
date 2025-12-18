import { NextResponse } from "next/server";

import { listIncidentRecords } from "@/lib/incident/storage";

export async function GET(req: Request) {
    const url = new URL(req.url);
    const limitParam = Number(url.searchParams.get("limit"));
    const limit = Number.isFinite(limitParam) && limitParam > 0 ? limitParam : 20;

    try {
        const incidents = await listIncidentRecords(limit);
        return NextResponse.json({ ok: true, incidents });
    } catch (error) {
        console.error("[incidents] failed to fetch", error);
        return NextResponse.json({ ok: false, error: "Failed to load incidents" }, { status: 500 });
    }
}
