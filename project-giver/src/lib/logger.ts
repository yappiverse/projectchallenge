import { trace } from "@opentelemetry/api";
import { exportLogEntry } from "@/lib/logs-exporter";

export interface LogContext {
	traceId?: string;
	spanId?: string;
	[key: string]: unknown;
}

// This interface is imported by logs-exporter.ts
export interface LogEntry {
	timestamp: string;
	level: "trace" | "debug" | "info" | "warn" | "error" | "fatal";
	message: string;
	context: LogContext;
	error?: Error;
}

class Logger {
	private getTraceContext(): Pick<LogContext, "traceId" | "spanId"> {
		const span = trace.getActiveSpan();
		if (!span) return {};
		const { traceId, spanId } = span.spanContext();
		return { traceId, spanId };
	}

	private log(
		level: "trace" | "debug" | "info" | "warn" | "error" | "fatal",
		message: string,
		context?: LogContext,
		error?: Error,
	) {
		const entry: LogEntry = {
			// Use the LogEntry type
			timestamp: new Date().toISOString(),
			level,
			message,
			context: { ...this.getTraceContext(), ...context },
			error,
		};

		if (typeof window === "undefined") {
			exportLogEntry(entry);
		}
	}

	// Public methods for a complete logger
	trace(message: string, context?: LogContext) {
		this.log("trace", message, context);
	}

	debug(message: string, context?: LogContext) {
		this.log("debug", message, context);
	}

	info(message: string, context?: LogContext) {
		this.log("info", message, context);
	}

	warn(message: string, context?: LogContext) {
		this.log("warn", message, context);
	}

	error(message: string, error?: Error, context?: LogContext) {
		this.log("error", message, context, error);
	}

	fatal(message: string, error?: Error, context?: LogContext) {
		this.log("fatal", message, context, error);
	}
}

export const logger = new Logger();
