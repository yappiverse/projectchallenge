"use client";

import { browserLog } from "@/lib/browser-logger";

export default function ClientPanel() {
	return (
		<div className='space-x-2'>
			<button
				className='rounded bg-slate-200 px-3 py-2 text-sm font-medium text-slate-900 hover:bg-slate-300 dark:bg-slate-700 dark:text-slate-50 dark:hover:bg-slate-600'
				onClick={() =>
					browserLog.info("Browser button clicked", {
						page: "logs-demo",
						source: "client",
					})
				}>
				Emit browser log
			</button>
			<button
				className='rounded bg-rose-200 px-3 py-2 text-sm font-medium text-rose-900 hover:bg-rose-300 dark:bg-rose-700 dark:text-white dark:hover:bg-rose-600'
				onClick={() =>
					browserLog.error(
						"Simulated browser error",
						new Error("Client boom"),
						{
							page: "logs-demo",
							source: "client",
						},
					)
				}>
				Emit browser error
			</button>
		</div>
	);
}
