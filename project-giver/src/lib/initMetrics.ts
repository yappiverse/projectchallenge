import {
	MeterProvider,
	PeriodicExportingMetricReader,
} from "@opentelemetry/sdk-metrics";
import { OTLPMetricExporter } from "@opentelemetry/exporter-metrics-otlp-http";
import { RuntimeNodeInstrumentation } from "@opentelemetry/instrumentation-runtime-node";
import { registerInstrumentations } from "@opentelemetry/instrumentation";
import { HostMetrics } from "@opentelemetry/host-metrics";
import { resourceFromAttributes } from "@opentelemetry/resources";
import {
	ATTR_SERVICE_NAME,
	ATTR_SERVICE_VERSION,
} from "@opentelemetry/semantic-conventions";

let started = false;

export function initMetrics() {
	if (started) return;
	started = true;

	const resource = resourceFromAttributes({
		[ATTR_SERVICE_NAME]: process.env.OTEL_SERVICE_NAME ?? "project-giver",
		[ATTR_SERVICE_VERSION]: process.env.npm_package_version ?? "1.0.0",
	});

	const exporter = new OTLPMetricExporter({
		url: "http://localhost:4318/v1/metrics",
	});

	const meterProvider = new MeterProvider({
		resource,
		readers: [
			new PeriodicExportingMetricReader({
				exporter,
				exportIntervalMillis: 5000,
			}),
		],
	});

	const hostMetrics = new HostMetrics({
		meterProvider,
		name: "host-metrics",
	});
	hostMetrics.start();

	registerInstrumentations({
		meterProvider,
		instrumentations: [
			new RuntimeNodeInstrumentation({
				monitoringPrecision: 5000,
			}),
		],
	});

	const meter = meterProvider.getMeter("process-metrics");

	const memoryGauge = meter.createObservableGauge("process.memory.usage", {
		description: "Node.js process memory usage",
		unit: "bytes",
	});

	memoryGauge.addCallback((observableResult) => {
		const mem = process.memoryUsage();

		observableResult.observe(mem.rss, { type: "rss" });
		observableResult.observe(mem.heapUsed, { type: "heapUsed" });
		observableResult.observe(mem.heapTotal, { type: "heapTotal" });
		observableResult.observe(mem.external, { type: "external" });
		observableResult.observe(mem.arrayBuffers, { type: "arrayBuffers" });
	});
}
