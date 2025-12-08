import { NextResponse } from "next/server";
import { trace } from "@opentelemetry/api";
import { logger } from "@/lib/logger";

export async function GET() {
	const tracer = trace.getTracer("projecta");

	return tracer.startActiveSpan("log-warn", async (span) => {
		logger.emit({
			severityNumber: 13,
			severityText: "WARN",
			body: "Warning: Something unexpected happened, but service still functional",
		});

		span.end();
		return NextResponse.json({ level: "warn", message: "Warn log emitted" });
	});
}
