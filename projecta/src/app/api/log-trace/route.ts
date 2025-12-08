import { NextResponse } from "next/server";
import { trace } from "@opentelemetry/api";
import { logger } from "@/lib/logger";

export async function GET() {
	const tracer = trace.getTracer("projecta");

	return tracer.startActiveSpan("log-trace", async (span) => {
		logger.emit({
			severityNumber: 1,
			severityText: "TRACE",
			body: "This is a TRACE level log",
		});

		span.end();
		return NextResponse.json({ level: "trace", message: "Trace log emitted" });
	});
}
