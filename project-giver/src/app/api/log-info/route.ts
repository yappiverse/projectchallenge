import { NextResponse } from "next/server";
import { logger } from "@/lib/logger";

export async function GET() {
	const orderId = Math.floor(Math.random() * 90000) + 10000;
	const amount = parseFloat((Math.random() * 500).toFixed(2));
	const itemsList = [
		{ id: "p1", name: "Wireless Headphones", price: 150.0 },
		{ id: "p2", name: "Mechanical Keyboard", price: 120.0 },
		{ id: "p3", name: "Gaming Mouse", price: 60.0 },
		{ id: "p4", name: "USB-C Hub", price: 45.0 },
	];
	const item = itemsList[Math.floor(Math.random() * itemsList.length)];

	logger.info(`Info: Order #${orderId} processed successfully`, {
		orderId: orderId.toString(),
		amount: amount,
		currency: "USD",
		item_count: 1,
	});

	return NextResponse.json({
		order_id: orderId.toString(),
		status: "confirmed",
		items: [{ ...item, price: amount }], // Just using random amount as price for simplicity
		total: amount,
		timestamp: new Date().toISOString(),
	});
}
