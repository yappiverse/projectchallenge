import { NextResponse } from "next/server";
import { logger } from "@/lib/logger";

type TraceScenario = {
	message: string;
	context: Record<string, unknown>;
	response: Record<string, unknown>;
};

const scenarioFactories: Array<() => TraceScenario> = [
	() => {
		const calcId = `calc_${Math.floor(Math.random() * 100000)}`;
		return {
			message: `Trace: Beginning complex calculation cycle [${calcId}]`,
			context: {
				step: "initialization",
				memory_usage: `${Math.floor(Math.random() * 50) + 10}MB`,
				calculation_id: calcId,
			},
			response: {
				status: "success",
				data: {
					calculation_id: calcId,
					result: Math.floor(Math.random() * 1000),
					execution_time_ms: Math.floor(Math.random() * 50) + 5,
				},
			},
		};
	},
	() => {
		const spanId = `span_${Math.random().toString(36).slice(2, 7)}`;
		return {
			message: `Trace: Cache hydration workflow started [${spanId}]`,
			context: {
				step: "cache_hydration",
				source: "redis",
				spanId,
			},
			response: {
				status: "success",
				stage: "cache_hydration",
				span_id: spanId,
				rows_loaded: Math.floor(Math.random() * 200) + 50,
			},
		};
	},
	() => {
		const pipelineId = `pipe_${Math.floor(Math.random() * 9999)}`;
		return {
			message: `Trace: Analytics pipeline step executed [${pipelineId}]`,
			context: {
				step: "feature_engineering",
				input_records: Math.floor(Math.random() * 5000) + 1000,
				pipeline_id: pipelineId,
			},
			response: {
				status: "success",
				pipeline_id: pipelineId,
				processed_records: Math.floor(Math.random() * 5000) + 1000,
				stage: "feature_engineering",
			},
		};
	},
	() => {
		const requestKey = `req-${Math.floor(Math.random() * 100000)}`;
		return {
			message: `Trace: External API fan-out [${requestKey}]`,
			context: {
				step: "fan_out",
				requests: 3,
				request_key: requestKey,
			},
			response: {
				status: "success",
				request_key: requestKey,
				latency_budget_ms: 120,
				parallel_calls: 3,
			},
		};
	},
];

export async function GET() {
	const scenario = scenarioFactories[
		Math.floor(Math.random() * scenarioFactories.length)
	]();

	logger.trace(scenario.message, scenario.context);

	return NextResponse.json(scenario.response);
}
