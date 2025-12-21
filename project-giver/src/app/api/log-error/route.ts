import { NextResponse } from "next/server";
import { logger } from "@/lib/logger";

export async function GET() {
	const scenarios = [
		// Existing
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

		// 🔐 Authentication & Authorization
		{
			msg: "JWT token expired",
			error: "Access token has expired",
			code: "TOKEN_EXPIRED",
			status: 401,
			context: { expired_at: "2025-01-12T10:42:11Z" },
		},
		{
			msg: "Forbidden resource access",
			error: "User does not have required role",
			code: "FORBIDDEN",
			status: 403,
			context: { role: "viewer", required: "admin" },
		},

		// 🌐 Network / External Service
		{
			msg: "Failed to reach external API",
			error: "DNS lookup failed",
			code: "DNS_ERR",
			status: 503,
			context: { hostname: "api.partner.com" },
		},
		{
			msg: "Upstream service returned invalid response",
			error: "Unexpected response format",
			code: "UPSTREAM_BAD_RESPONSE",
			status: 502,
			context: { service: "inventory-service" },
		},

		// 🗄 Database
		{
			msg: "Query execution timeout",
			error: "Statement timeout exceeded",
			code: "DB_QUERY_TIMEOUT",
			status: 504,
			context: { query: "SELECT * FROM transactions" },
		},
		{
			msg: "Unique constraint violation",
			error: "Duplicate key value violates unique constraint",
			code: "DB_DUPLICATE_KEY",
			status: 409,
			context: { constraint: "users_email_key" },
		},

		// 🧠 Application / Logic
		{
			msg: "Unhandled exception occurred",
			error: "Cannot read properties of undefined",
			code: "UNHANDLED_EXCEPTION",
			status: 500,
			context: { function: "processPayment" },
		},
		{
			msg: "Invalid request payload",
			error: "Schema validation failed",
			code: "VALIDATION_ERR",
			status: 400,
			context: { field: "amount", reason: "must be a positive number" },
		},

		// 🐳 Infrastructure / Runtime
		{
			msg: "Service crashed unexpectedly",
			error: "Out of memory",
			code: "OOM_KILLED",
			status: 500,
			context: { container: "api-service", memory_limit: "512Mi" },
		},
		{
			msg: "Pod restart detected",
			error: "Liveness probe failed",
			code: "POD_RESTART",
			status: 503,
			context: { pod: "api-7d9c6f8b9f-x2kls" },
		},

		// 📦 Rate Limit / Throttling
		{
			msg: "Too many requests",
			error: "Rate limit exceeded",
			code: "RATE_LIMIT",
			status: 429,
			context: { limit: "100/min", client_ip: "203.0.113.42" },
		},

		// 📡 Observability / Telemetry
		{
			msg: "Trace export failed",
			error: "Failed to export spans",
			code: "OTEL_EXPORT_ERR",
			status: 500,
			context: { exporter: "OTLP", endpoint: "signoz-collector:4317" },
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
