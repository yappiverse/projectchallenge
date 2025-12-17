import { NextResponse } from "next/server";
import { logger } from "@/lib/logger";

export async function GET() {
	const scenarios = [
		{
			msg: "Service process crashing due to OOM",
			error: "Memory allocation failed",
			code: "CRITICAL_OOM",
			context: { memory_available: "0MB" },
		},
		{
			msg: "Critical configuration file missing",
			error: "ENOENT: config/production.json not found",
			code: "CONFIG_MISSING",
			context: { path: "/etc/app/config" },
		},
		{
			msg: "Disk space exhausted on root volume",
			error: "No space left on device",
			code: "DISK_FULL",
			context: { mount: "/", usage: "100%" },
		},
	];

	const scenario = scenarios[Math.floor(Math.random() * scenarios.length)];

	const errorObj = new Error(scenario.error);
	logger.fatal(`Fatal: ${scenario.msg}`, errorObj, {
		process_uptime: `${Math.floor(Math.random() * 100)}h`,
		...scenario.context,
	});

	return NextResponse.json(
		{
			error: "Critical System Failure",
			code: scenario.code,
			message: "Service is restarting...",
			details: scenario.error,
		},
		{ status: 503 },
	);
}
