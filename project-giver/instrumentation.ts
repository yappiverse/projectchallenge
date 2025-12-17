import { registerOTel } from "@vercel/otel";
import { initializeLogsExporter } from "@/lib/logs-exporter";
import { initMetrics } from "@/lib/initMetrics";
export function register() {
	registerOTel({ serviceName: "project-giver" });

	if (process.env.NEXT_RUNTIME === "nodejs") {
		initializeLogsExporter();
		initMetrics();
	}
}
