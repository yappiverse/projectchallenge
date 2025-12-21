import { NextResponse } from "next/server";
import { logger } from "@/lib/logger";

type InfoScenario = {
	message: string;
	context: Record<string, unknown>;
	response: Record<string, unknown>;
};

const scenarioFactories: Array<() => InfoScenario> = [
	() => {
		const orderId = Math.floor(Math.random() * 90000) + 10000;
		const amount = parseFloat((Math.random() * 500).toFixed(2));
		return {
			message: `Info: Order #${orderId} processed successfully`,
			context: {
				orderId: orderId.toString(),
				amount,
				currency: "USD",
				item_count: 1,
			},
			response: {
				order_id: orderId.toString(),
				status: "confirmed",
				total: amount,
				items: [
					{
						id: `sku_${Math.floor(Math.random() * 500)}`,
						name: "Wireless Headphones",
						price: amount,
					},
				],
				timestamp: new Date().toISOString(),
			},
		};
	},
	() => {
		const userId = `user_${Math.floor(Math.random() * 8000)}`;
		const months = [1, 3, 12][Math.floor(Math.random() * 3)];
		return {
			message: `Info: Subscription renewed for ${userId}`,
			context: {
				userId,
				plan: months === 12 ? "pro" : "starter",
				renewal_term_months: months,
			},
			response: {
				user_id: userId,
				plan: months === 12 ? "pro" : "starter",
				renewal_term_months: months,
				renewed_at: new Date().toISOString(),
			},
		};
	},
	() => {
		const payoutId = `po_${Math.floor(Math.random() * 999999)}`;
		const amount = parseFloat((Math.random() * 1500).toFixed(2));
		return {
			message: `Info: Vendor payout ${payoutId} settled`,
			context: {
				payoutId,
				amount,
				currency: "USD",
				method: "ACH",
			},
			response: {
				payout_id: payoutId,
				status: "settled",
				amount,
				currency: "USD",
				settled_at: new Date().toISOString(),
			},
		};
	},
	() => {
		const warehouse = `wh-${Math.floor(Math.random() * 4) + 1}`;
		const sku = `sku-${Math.floor(Math.random() * 900) + 100}`;
		const restocked = Math.floor(Math.random() * 300) + 50;
		return {
			message: `Info: Inventory restock completed for ${sku}`,
			context: {
				warehouse,
				sku,
				restocked,
			},
			response: {
				sku,
				warehouse,
				status: "restocked",
				quantity_added: restocked,
				completed_at: new Date().toISOString(),
			},
		};
	},
	() => {
		const journeyId = `journey_${Math.floor(Math.random() * 10000)}`;
		return {
			message: `Info: Customer onboarding journey ${journeyId} completed`,
			context: {
				journeyId,
				steps: 6,
				duration_seconds: Math.floor(Math.random() * 400) + 200,
			},
			response: {
				journey_id: journeyId,
				status: "completed",
				milestones: ["account_created", "profile_complete", "first_transaction"],
				completed_at: new Date().toISOString(),
			},
		};
	},
];

export async function GET() {
	const scenario = scenarioFactories[
		Math.floor(Math.random() * scenarioFactories.length)
	]();

	logger.info(scenario.message, scenario.context);

	return NextResponse.json(scenario.response);
}
