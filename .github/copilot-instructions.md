# Copilot Instructions

## Workspace Map

- [project-giver](project-giver) is a Next.js 16 demo service that produces richly annotated logs and metrics via OpenTelemetry; use it to generate traffic that ultimately lands in SigNoz/ClickHouse.
- [projecta](projecta) is a separate Next.js 16 app that receives SigNoz Alertmanager webhooks and crafts Gemini-based incident summaries.
- [docker](docker) spins up the local SigNoz stack (ClickHouse, Postgres auth DB, collectors) with `docker compose -f docker/docker-compose.yml up -d`; configs under [common](common) feed that stack.
- [locust-scripts](locust-scripts) and [dashboards](common/dashboards) provide load testing and ready-made SigNoz dashboards if you need sample traffic visualizations.

## Local Ops

- Each app has its own package.json; run `npm install` + `npm run dev` from the respective folder. They both expect Node 18+ with the experimental React Compiler enabled (see `babel-plugin-react-compiler`).
- Export OTLP data to the bundled collector by pointing `OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4318`; the docker-compose file already exposes those ports.
- SIGNoz/Gemini credentials live in `.env.local` files; see [projecta/src/lib/env.ts](projecta/src/lib/env.ts) for required keys (`SIGNOZ_API_KEY`, `GEMINI_API_KEY`, optional base URLs and rate-limit tweaks).

## project-giver Logging Flow

- Server logs flow through [project-giver/src/lib/logger.ts](project-giver/src/lib/logger.ts) → [project-giver/src/lib/logs-exporter.ts](project-giver/src/lib/logs-exporter.ts); `logger` adds trace/span context from `@opentelemetry/api` and only exports when running on the server.
- [project-giver/instrumentation.ts](project-giver/instrumentation.ts) runs on boot, registering Vercel OTel, enabling the OTLP log exporter, and starting runtime/host metrics via [project-giver/src/lib/initMetrics.ts](project-giver/src/lib/initMetrics.ts).
- Browser logging is buffered and periodically flushed to `/api/logs` via `navigator.sendBeacon` in [project-giver/src/lib/browser-logger.ts](project-giver/src/lib/browser-logger.ts); every log is enriched with session, URL, user agent, and trace IDs before submission.
- `/api/logs` ([project-giver/src/app/api/logs/route.ts](project-giver/src/app/api/logs/route.ts)) replays browser payloads through the server logger, rehydrating errors and tagging them with the requester’s headers.
- Sample endpoints under [project-giver/src/app/api/log-\*/route.ts](project-giver/src/app/api) emit deterministic payloads per level (info/debug/warn/error/fatal/trace) so you can verify ingestion; the UI at [project-giver/src/app/logs-demo/page.tsx](project-giver/src/app/logs-demo/page.tsx) wires them with server actions and client buttons.

## projecta Incident Flow

- Alertmanager posts to [projecta/src/app/api/webhook/route.ts](projecta/src/app/api/webhook/route.ts); invalid payloads are ignored, and valid ones trigger `generateIncidentSummary` inside an OpenTelemetry root context so downstream logging spans stay linked.
- [projecta/src/lib/signoz/logs-service.ts](projecta/src/lib/signoz/logs-service.ts) queries `/api/v5/query_range`, allowing overrides via `builderQueryOverrides`; defaults fetch the last hour of logs.
- Raw rows pass through [projecta/src/lib/signoz/log-normalizer.ts](projecta/src/lib/signoz/log-normalizer.ts), which dedupes by message/error/gateway/db_host and caps results (10 by default) to keep Gemini prompts concise.
- [projecta/src/lib/incident/prompt-builder.ts](projecta/src/lib/incident/prompt-builder.ts) assembles Indonesian-language templates plus alert metadata and normalized logs; you can override the template via `IncidentEngineOptions`.
- `requestGeminiSummary` in [projecta/src/lib/gemini/client.ts](projecta/src/lib/gemini/client.ts) enforces a local rate limit (`GEMINI_MIN_CALL_GAP_MS`) and returns raw candidates; `extractGeminiText` collapses them into plain text for console output.
- `/api/prompt` ([projecta/src/app/api/prompt/route.ts](projecta/src/app/api/prompt/route.ts)) is a fallback endpoint that brute-force searches legacy SigNoz log APIs and forwards excerpts to Gemini without the structured normalization pipeline.

## Integrations & Env

- SigNoz API access requires `SIGNOZ_API_KEY` and `SIGNOZ_BASE_URL`; Gemini calls need `GEMINI_API_KEY` plus optional `GEMINI_URL`. Keep these in the app-level `.env.local` files—`requireEnv` throws early if they are missing.
- OTLP collectors expect both apps to set `OTEL_SERVICE_NAME` (defaults differ: project-giver vs projecta) so traces/logs remain separable in SigNoz dashboards.
- When adding new collectors or exporters, prefer wiring them through instrumentation hooks rather than ad-hoc bootstrap code so Next.js edge/server runtimes stay stable.

## Patterns & Tips

- Long-running or expensive work triggered by HTTP handlers should be deferred (see the `setTimeout` in the webhook route) so Alertmanager callbacks stay fast yet still run inside an OpenTelemetry root context.
- Extend the logging pipeline by enriching `LogContext` and letting the exporter map those fields to OTLP attributes—avoid embedding JSON blobs in the `message` string.
- `builderQueryOverrides` lets you reuse `fetchSigNozLogs` for more complex filters (service filters, severity clauses) without rewriting the request shape.
- Keep Gemini prompts short: increase `maxEntries` or disable dedupe only when necessary, and update the Indonesian template if stakeholders need a different tone or structure.
- For debugging, use `/api/webhook/debug` and the logs-demo page instead of editing production routes; both endpoints echo payloads without touching SigNoz or Gemini.
