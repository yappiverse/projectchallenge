import { NextResponse } from "next/server";
import { logger } from "@/lib/logger";

export async function GET() {
	const scenarios = [
		{
			msg: "Deprecated API version usage detected",
			data: { version: "v1", suggestion: "Upgrade to v2" },
			warning: "You are using a deprecated API version. Please upgrade to v2.",
		},
		{
			msg: "Rate limit approaching threshold",
			data: { current_usage: 950, limit: 1000, reset_in: "5m" },
			warning: "You have used 95% of your hourly request quota.",
		},
		{
			msg: "High latency detected in upstream service",
			data: { service: "inventory-api", latency_ms: 450 },
			warning: "Response times may be slower than usual.",
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
		data: { user_count: Math.floor(Math.random() * 1000) },
		warning: scenario.warning,
	});
}
