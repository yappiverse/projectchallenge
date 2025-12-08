import { NextResponse } from "next/server";
import { trace } from "@opentelemetry/api";
import { logger } from "@/lib/logger";

export async function GET() {
	const tracer = trace.getTracer("projecta");

	return tracer.startActiveSpan("log-fatal", async (span) => {
		const message = "FATAL: unrecoverable system failure simulated";

		logger.emit({
			severityNumber: 21,
			severityText: "FATAL",
			body: message,
		});

		span.recordException(new Error(message));
		span.setStatus({ code: 2, message });

		span.end();
		return NextResponse.json({ level: "fatal", message }, { status: 500 });
	});
}
