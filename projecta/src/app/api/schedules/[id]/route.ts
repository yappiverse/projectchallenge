import { NextResponse } from "next/server";

import { removeSchedule } from "@/lib/scheduler/service";

interface RouteContext {
    params: Promise<{ id: string }> | { id: string };
}

export async function DELETE(_request: Request, context: RouteContext) {
    const params = await Promise.resolve(context.params);

    if (!params?.id) {
        return NextResponse.json({ ok: false, error: "Missing schedule id" }, { status: 400 });
    }

    try {
        const removed = await removeSchedule(params.id);
        if (!removed) {
            return NextResponse.json({ ok: false, error: "Schedule not found" }, { status: 404 });
        }
        return NextResponse.json({ ok: true });
    } catch (error) {
        console.error("[schedules] failed to delete", error);
        return NextResponse.json({ ok: false, error: "Failed to delete schedule" }, { status: 500 });
    }
}
