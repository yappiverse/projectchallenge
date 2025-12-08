import { NextResponse } from "next/server";
import { trace } from "@opentelemetry/api";
import { logger } from "@/lib/logger";

export async function GET() {
	const tracer = trace.getTracer("projecta");

	return tracer.startActiveSpan("log-error", async (span) => {
		const message = "ERROR: operation failed";

		logger.emit({
			severityNumber: 17,
			severityText: "ERROR",
			body: message,
		});

		span.recordException(new Error(message));
		span.setStatus({ code: 2, message });

		span.end();
		return NextResponse.json({ level: "error", message }, { status: 500 });
	});
}
