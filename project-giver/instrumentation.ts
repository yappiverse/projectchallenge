import { registerOTel } from "@vercel/otel";
import { initializeLogsExporter } from "@/lib/logs-exporter";
export function register() {
	registerOTel({ serviceName: "project-giver" });

	if (process.env.NEXT_RUNTIME === "nodejs") {
		initializeLogsExporter();
	}
}
