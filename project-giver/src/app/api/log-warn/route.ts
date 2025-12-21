import { NextResponse } from "next/server";
import { logger } from "@/lib/logger";

export async function GET() {
	const scenarios = [
		{
			msg: "Deprecated API version usage detected",
			data: { version: "v1", suggestion: "Upgrade to v2" },
			warning: "You are using a deprecated API version. Please upgrade to v2.",
			responseData: { api_version: "v1" },
		},
		{
			msg: "Rate limit approaching threshold",
			data: { current_usage: 950, limit: 1000, reset_in: "5m" },
			warning: "You have used 95% of your hourly request quota.",
			responseData: { current_usage: 950, limit: 1000 },
		},
		{
			msg: "High latency detected in upstream service",
			data: { service: "inventory-api", latency_ms: 450 },
			warning: "Response times may be slower than usual.",
			responseData: { service: "inventory-api", latency_ms: 450 },
		},
		{
			msg: "Message queue depth nearing capacity",
			data: { queue: "jobs-critical", depth: 890, limit: 1000 },
			warning: "Background job processing is delayed due to high queue depth.",
			responseData: { queue: "jobs-critical", depth: 890 },
		},
		{
			msg: "Configuration drift detected across replicas",
			data: {
				service: "edge-proxy",
				expected_hash: "a19ff2",
				observed_hash: "c44dd0",
			},
			warning: "At least one replica runs an outdated configuration revision.",
			responseData: { service: "edge-proxy" },
		},
		{
			msg: "Anomaly detected in hourly error rate",
			data: { error_rate: 0.07, baseline: 0.01 },
			warning: "Error rate is trending above baseline; monitor closely.",
			responseData: { error_rate: 0.07 },
		},
		{
			msg: "Search indexing lag detected",
			data: { index: "products", lag_seconds: 420 },
			warning: "Recent catalog updates may take longer to appear in search.",
			responseData: { index: "products", lag_seconds: 420 },
		},
	];

	const scenario = scenarios[Math.floor(Math.random() * scenarios.length)];
	const clientIp = `192.168.1.${Math.floor(Math.random() * 255)}`;

	logger.warn(`Warn: ${scenario.msg}`, {
		...scenario.data,
		client_ip: clientIp,
	});

	return NextResponse.json({
		status: "success", // Warnings often still return success
		data: {
			user_count: Math.floor(Math.random() * 1000),
			...(scenario.responseData ?? {}),
		},
		warning: scenario.warning,
	});
}
