import { registerOTel } from "@vercel/otel";

export async function register() {
	registerOTel({ serviceName: "project-giver" });

	if (process.env.NEXT_RUNTIME !== "nodejs") {
		return;
	}

	const [{ initializeLogsExporter }, { initMetrics }] = await Promise.all([
		import("@/lib/logs-exporter"),
		import("@/lib/initMetrics"),
	]);

	initializeLogsExporter();
	initMetrics();
}
