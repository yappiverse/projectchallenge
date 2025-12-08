import { NextResponse } from "next/server";
import { trace } from "@opentelemetry/api";
import { logger } from "@/lib/logger";

export async function GET() {
	const tracer = trace.getTracer("projecta");

	return tracer.startActiveSpan("log-info", async (span) => {
		logger.emit({
			severityNumber: 9,
			severityText: "INFO",
			body: "This is an INFO level event",
		});

		span.end();
		return NextResponse.json({ level: "info", message: "Info log emitted" });
	});
}
