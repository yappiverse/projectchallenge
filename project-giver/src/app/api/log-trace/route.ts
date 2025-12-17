import { NextResponse } from "next/server";
import { logger } from "@/lib/logger";

export async function GET() {
	const calcId = `calc_${Math.floor(Math.random() * 100000)}`;
	const executionTime = Math.floor(Math.random() * 50) + 5; // 5-55ms
	const result = Math.floor(Math.random() * 1000);

	logger.trace(`Trace: Beginning complex calculation cycle [${calcId}]`, {
		step: "initialization",
		memory_usage: `${Math.floor(Math.random() * 50) + 10}MB`,
		calculation_id: calcId,
	});

	// Simulate some work
	return NextResponse.json({
		status: "success",
		data: {
			calculation_id: calcId,
			result: result,
			execution_time_ms: executionTime,
		},
	});
}
