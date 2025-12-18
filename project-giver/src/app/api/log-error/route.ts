import { NextResponse } from "next/server";
import { logger } from "@/lib/logger";

export async function GET() {
	const scenarios = [
		{
			msg: "Transaction failed due to upstream timeout",
			error: "Payment gateway timeout",
			code: "GATEWAY_TIMEOUT",
			status: 502,
			context: { gateway: "Stripe" },
		},
		{
			msg: "Database connection refused",
			error: "Connection pool exhausted",
			code: "DB_CONN_ERR",
			status: 500,
			context: { db_host: "primary-db-01" },
		},
		{
			msg: "Unauthorized access attempt",
			error: "Invalid API Key",
			code: "AUTH_ERR",
			status: 401,
			context: { attempt_count: 3 },
		},
	];

	const scenario = scenarios[Math.floor(Math.random() * scenarios.length)];
	const txId = `tx_${Math.floor(Math.random() * 10000)}`;

	const errorObj = new Error(scenario.error);
	logger.error(`Error: ${scenario.msg}`, errorObj, {
		transactionId: txId,
		...scenario.context,
	});

	return NextResponse.json(
		{
			error: scenario.msg,
			code: scenario.code,
			message: scenario.error,
			transaction_id: txId,
		},
		{ status: scenario.status },
	);
}
