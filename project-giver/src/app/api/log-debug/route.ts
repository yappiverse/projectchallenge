import { NextResponse } from "next/server";
import { logger } from "@/lib/logger";

export async function GET() {
	const userId = `user_${Math.floor(Math.random() * 1000)}`;
	const requestId = `req_${Math.random().toString(36).substring(7)}`;
	const actions = ["update_profile", "fetch_settings", "sync_data"];
	const action = actions[Math.floor(Math.random() * actions.length)];

	const requestData = { userId, action };

	logger.debug(`Debug: Incoming request payload validated [${requestId}]`, {
		payload: requestData,
		validation_rules: ["required_fields", "type_check"],
		requestId,
	});

	return NextResponse.json({
		status: "ok",
		validated: true,
		debug_metadata: {
			requestId,
			parser: "v2.1",
			processing_node: `node-${Math.floor(Math.random() * 5)}`,
		},
	});
}
