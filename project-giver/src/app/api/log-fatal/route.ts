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
		{
			msg: "Primary data center unreachable",
			error: "Control plane detected total loss of connectivity",
			code: "SITE_OUTAGE",
			context: { region: "us-central", failover_initiated: true },
		},
		{
			msg: "Secret decryption failed during boot",
			error: "Hardware security module rejected request",
			code: "SECRETS_UNAVAILABLE",
			context: { hsm_cluster: "hsm-prod-03", attempts: 3 },
		},
		{
			msg: "Blocking migration failed irrecoverably",
			error: "ALTER TABLE command aborted cluster-wide",
			code: "MIGRATION_FATAL",
			context: { migration_id: `mig-${Math.floor(Math.random() * 1000)}` },
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
