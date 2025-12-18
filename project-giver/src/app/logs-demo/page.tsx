import ClientPanel from "@/app/logs-demo/ClientPanel";
import { logger } from "@/lib/logger"; // Or use serverLogger from Step 6

async function serverLogAction() {
	"use server";

	logger.info("Server action log", {
		page: "logs-demo",
		source: "server",
		kind: "server-action",
	});

	try {
		throw new Error("Server boom");
	} catch (error) {
		logger.error("Server error occurred", error as Error, {
			page: "logs-demo",
			source: "server",
		});
	}
}

export default function LogsDemoPage() {
	return (
		<div className='space-y-4 p-6'>
			<div className='space-y-1'>
				<h1 className='text-2xl font-semibold'>Logs Demo</h1>
				<p className='text-muted-foreground text-sm'>
					Trigger a server action and browser logs, then verify they land in
					SigNoz.
				</p>
			</div>
			<form action={serverLogAction}>
				<button
					type='submit'
					className='rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500'>
					Emit server logs (server action)
				</button>
			</form>
			<ClientPanel />
		</div>
	);
}
