import { NextResponse } from "next/server";
import { trace } from "@opentelemetry/api";
import { logger } from "@/lib/logger";

export async function GET() {
	const tracer = trace.getTracer("projecta");

	return tracer.startActiveSpan("log-debug", async (span) => {
		logger.emit({
			severityNumber: 5,
			severityText: "DEBUG",
			body: "Debug message for development",
		});

		span.end();
		return NextResponse.json({ level: "debug", message: "Debug log emitted" });
	});
}
