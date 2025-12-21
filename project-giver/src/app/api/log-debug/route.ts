import { NextResponse } from "next/server";
import { logger } from "@/lib/logger";

export async function GET() {
	const userId = `user_${Math.floor(Math.random() * 1000)}`;
	const requestId = `req_${Math.random().toString(36).substring(7)}`;
	const actions = ["update_profile", "fetch_settings", "sync_data", "export_data"];
	const action = actions[Math.floor(Math.random() * actions.length)];

	const scenarios = [
		{
			code: "payload_validation",
			msg: "Incoming request payload validated",
			context: {
				validation_rules: ["required_fields", "type_check"],
				schema_version: "v2.1",
			},
			response: {
				validated: true,
				parser: "v2.1",
			},
		},
		{
			code: "cache_miss_refresh",
			msg: "Cache miss triggers upstream refresh",
			context: {
				cache_key: `profile:${userId}`,
				event: "cache_miss",
			},
			response: {
				validated: true,
				cache_action: "refresh",
			},
		},
		{
			code: "feature_flag_eval",
			msg: "Feature flag evaluation completed",
			context: {
				flag_key: "beta-dashboard",
				variant: Math.random() > 0.5 ? "treatment" : "control",
			},
			response: {
				validated: false,
				flag: "beta-dashboard",
			},
		},
		{
			code: "webhook_signature",
			msg: "Webhook signature verified",
			context: {
				integration: "resend",
				signature_age_ms: Math.floor(Math.random() * 800),
			},
			response: {
				validated: true,
				verification_latency_ms: Math.floor(Math.random() * 20) + 5,
			},
		},
		{
			code: "job_enqueue",
			msg: "Job enqueued for async processing",
			context: {
				queue: "profile-sync",
				priority: Math.random() > 0.5 ? "high" : "normal",
			},
			response: {
				validated: true,
				queue: "profile-sync",
				position: Math.floor(Math.random() * 25) + 1,
			},
		},
	];

	const scenario = scenarios[Math.floor(Math.random() * scenarios.length)];
	const requestData = { userId, action };

	logger.debug(`Debug: ${scenario.msg} [${requestId}]`, {
		payload: requestData,
		requestId,
		...scenario.context,
	});

	return NextResponse.json({
		status: "ok",
		requestId,
		debug_metadata: {
			processing_node: `node-${Math.floor(Math.random() * 5)}`,
			...scenario.response,
		},
	});
}
