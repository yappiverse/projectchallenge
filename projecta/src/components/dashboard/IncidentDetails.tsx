"use client";

import { useMemo, useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";

import type { IncidentRecord } from "@/lib/incident/storage";
import {
  formatDateTime,
  getSeverityPalette,
} from "@/components/dashboard/helpers";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

interface IncidentDetailsProps {
  incident: IncidentRecord;
}

const StatTile = ({
  title,
  value,
  meta,
}: {
  title: string;
  value: string;
  meta: string;
}) => (
  <div className="rounded-xl border border-border bg-card p-4 shadow-sm transition-colors">
    <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
      {title}
    </p>
    <p className="mt-2 text-2xl font-semibold text-foreground">{value}</p>
    <p className="text-sm text-muted-foreground">{meta}</p>
  </div>
);

interface SummaryChunk {
  icon: string;
  title?: string;
  detail: string;
}

const toSummaryChunk = (line: string): SummaryChunk => {
  const trimmed = line.trim();
  if (!trimmed)
    return {
      icon: "✦",
      detail: "Ringkasan belum tersedia.",
    };

  const emojiMatch = trimmed.match(
    /^([\p{Emoji_Presentation}\p{Emoji}\p{S}\p{P}]{1,3})\s+(.*)$/u
  );
  const body = emojiMatch ? emojiMatch[2].trim() : trimmed;
  const [maybeTitle, ...rest] = body.split(":");
  const hasTitle = rest.length > 0 && maybeTitle.length <= 30;
  const detail = hasTitle ? rest.join(":").trim() : body;

  return {
    icon: emojiMatch ? emojiMatch[1] : "✦",
    title: hasTitle ? maybeTitle.trim() : undefined,
    detail: detail || body,
  };
};

const KeyValueGrid = ({
  data,
  emptyLabel,
}: {
  data?: Record<string, string>;
  emptyLabel: string;
}) => {
  const entries = Object.entries(data ?? {}).filter(([, value]) =>
    Boolean(value)
  );
  if (entries.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border/60 bg-muted/30 p-4 text-sm text-muted-foreground">
        {emptyLabel}
      </div>
    );
  }
  return (
    <div className="grid gap-3 md:grid-cols-2">
      {entries.map(([key, value]) => (
        <div
          key={key}
          className="rounded-xl border border-border bg-card p-3 shadow-sm transition-colors"
        >
          <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
            {key}
          </p>
          {key.toLowerCase() === "related_logs" ? (
            <details className="mt-2 rounded-lg border border-border bg-muted/40 p-3 text-sm text-muted-foreground">
              <summary className="cursor-pointer text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
                Tampilkan tautan
              </summary>
              <p className="mt-3 whitespace-pre-wrap wrap-break-word text-sm text-foreground">
                {String(value)}
              </p>
            </details>
          ) : (
            <p className="mt-1 wrap-break-word text-sm font-semibold text-foreground">
              {String(value)}
            </p>
          )}
        </div>
      ))}
    </div>
  );
};

interface CollapsibleSectionProps {
  eyebrow: string;
  title: string;
  description?: string;
  children: ReactNode;
  defaultOpen?: boolean;
  action?: ReactNode;
}

const CollapsibleSection = ({
  eyebrow,
  title,
  description,
  children,
  defaultOpen = true,
  action,
}: CollapsibleSectionProps) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <section className="rounded-2xl border border-border bg-card/90 shadow-sm transition-colors">
      <button
        type="button"
        className="group flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition-colors hover:bg-muted/40"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
      >
        <div className="space-y-1">
          <p className="text-[10px] uppercase tracking-[0.35em] text-muted-foreground">
            {eyebrow}
          </p>
          <p className="text-lg font-semibold text-foreground group-hover:underline">
            {title}
          </p>
          {description && (
            <p className="text-sm text-muted-foreground">{description}</p>
          )}
        </div>
        <div className="flex items-center gap-3 text-muted-foreground">
          {action}
          <ChevronDown
            className={cn(
              "h-4 w-4 transition-transform",
              open ? "" : "-rotate-90"
            )}
            aria-hidden
          />
        </div>
      </button>
      {open && <div className="border-t border-border p-5">{children}</div>}
    </section>
  );
};

export default function IncidentDetails({ incident }: IncidentDetailsProps) {
  const [logTab, setLogTab] = useState<"normalized" | "raw">("normalized");
  const labels = incident.payload.commonLabels ?? {};
  const annotations = incident.payload.commonAnnotations ?? {};
  const primarySeverity =
    incident.normalizedLogs[0]?.severity ?? labels.severity;
  const palette = getSeverityPalette(primarySeverity);

  const highlights = useMemo(() => {
    const text = incident.summaryText ?? "";
    return text
      .split(/\n+/)
      .map((line) => line.trim())
      .filter(Boolean)
      .slice(0, 4);
  }, [incident.summaryText]);

  const uniqueServices = useMemo(() => {
    const services = new Set(
      incident.normalizedLogs
        .map((log) => log.service)
        .filter((service): service is string => Boolean(service))
    );
    return services.size;
  }, [incident.normalizedLogs]);

  const summaryParagraphs = highlights.length
    ? highlights
    : [incident.summaryText ?? "Ringkasan belum tersedia."].filter(Boolean);
  const summaryChunks = summaryParagraphs.map((entry) => toSummaryChunk(entry));

  return (
    <div className="flex flex-col gap-5 text-foreground">
      <CollapsibleSection
        eyebrow="Incident summary"
        title={
          incident.payload.commonLabels?.alertname ?? "Incident tanpa nama"
        }
        description={formatDateTime(incident.createdAt)}
        action={
          <Badge
            variant="outline"
            className={`flex items-center gap-2 px-4 py-2 text-[11px] tracking-[0.3em] ${palette.chip} ${palette.chipText}`}
          >
            <span className={`h-2 w-2 rounded-full ${palette.dot}`} />
            <span className="capitalize">{primarySeverity ?? "n/a"}</span>
          </Badge>
        }
      >
        <div className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-3">
            <div className="space-y-3 lg:col-span-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
                  Gemini summary
                </p>
                <Badge
                  variant="outline"
                  className="rounded-full px-3 py-1 text-[10px] uppercase tracking-[0.3em]"
                >
                  AI generated
                </Badge>
              </div>
              <div className="space-y-4 rounded-2xl border border-border bg-linear-to-br from-white via-primary/5 to-muted/60 p-5 shadow-lg transition-colors dark:from-[#161a27] dark:via-[#0f1117] dark:to-[#05070a]">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3 text-xs text-muted-foreground">
                  <p className="font-semibold text-foreground">
                    {incident.payload.commonLabels?.alertname ?? "Incident"}
                  </p>
                  <span>{formatDateTime(incident.createdAt)}</span>
                </div>
                <div className="space-y-3">
                  {summaryChunks.map((chunk, idx) => (
                    <div
                      key={`${chunk.detail}-${idx}`}
                      className="flex gap-3 rounded-2xl border border-border bg-background p-3 text-sm text-muted-foreground shadow-sm transition-colors dark:bg-white/5"
                    >
                      <span className="text-xl leading-none text-foreground">
                        {chunk.icon}
                      </span>
                      <div className="space-y-1">
                        {chunk.title && (
                          <p className="text-[11px] uppercase tracking-[0.3em] text-muted-foreground">
                            {chunk.title}
                          </p>
                        )}
                        <p className="wrap-break-word text-foreground">
                          {chunk.detail}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="space-y-3">
              <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
                Prompt
              </p>
              <details className="rounded-xl border border-border bg-card p-4 text-sm text-muted-foreground">
                <summary className="cursor-pointer text-xs uppercase tracking-[0.3em] text-muted-foreground">
                  Tampilkan prompt penuh
                </summary>
                <p className="mt-3 whitespace-pre-wrap wrap-break-word text-sm text-muted-foreground">
                  {incident.prompt}
                </p>
              </details>
              <div className="rounded-xl border border-dashed border-border/70 bg-muted/30 p-3 text-sm text-muted-foreground">
                {incident.geminiResponse
                  ? "Ringkasan berhasil"
                  : "Gemini dilewati / rate limited"}
              </div>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <StatTile
              title="Normalized"
              value={`${incident.normalizedLogs.length}`}
              meta="log terkurasi"
            />
            <StatTile
              title="Raw"
              value={`${incident.rawLogs.length}`}
              meta="log mentah"
            />
            <StatTile
              title="Services"
              value={`${uniqueServices || 1}`}
              meta="sumber unik"
            />
            <StatTile
              title="Trace data"
              value={
                incident.normalizedLogs.some((log) => log.trace_id)
                  ? "Ada"
                  : "Tidak ada"
              }
              meta="trace/span id"
            />
          </div>
        </div>
      </CollapsibleSection>

      <CollapsibleSection
        eyebrow="Alert context"
        title="Metadata from Alertmanager"
        description="Labels dan anotasi tersimpan di sini"
      >
        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-2">
            <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
              Labels
            </p>
            <KeyValueGrid data={labels} emptyLabel="Tidak ada label tambahan" />
          </div>
          <div className="space-y-2">
            <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
              Annotations
            </p>
            <KeyValueGrid data={annotations} emptyLabel="Tidak ada anotasi" />
          </div>
        </div>
      </CollapsibleSection>

      <CollapsibleSection
        eyebrow="Log evidence"
        title="Sumber log"
        description={`${incident.normalizedLogs.length} log terkurasi · ${incident.rawLogs.length} log mentah`}
      >
        <div className="space-y-4">
          <Tabs
            value={logTab}
            onValueChange={(value) => setLogTab(value as "normalized" | "raw")}
          >
            <TabsList className="rounded-full border border-border bg-transparent">
              <TabsTrigger value="normalized">Curated</TabsTrigger>
              <TabsTrigger value="raw">Raw</TabsTrigger>
            </TabsList>
            <TabsContent value="normalized">
              <div className="mt-4 space-y-3">
                {incident.normalizedLogs.map((log, idx) => (
                  <article
                    key={`${log.timestamp}-${idx}`}
                    className="rounded-xl border border-border bg-card p-4 shadow-sm transition-colors"
                  >
                    <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                      <span>{log.timestamp ?? "n/a"}</span>
                      {log.service && (
                        <span className="font-semibold text-foreground">
                          {log.service}
                        </span>
                      )}
                    </div>
                    <p className="mt-2 text-sm text-foreground">
                      {log.message ?? "(no message)"}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
                      {log.severity && (
                        <span className="rounded-full border border-border px-2 py-0.5 uppercase tracking-[0.2em]">
                          {log.severity}
                        </span>
                      )}
                      {log.error_message && (
                        <span className="rounded-full border border-border px-2 py-0.5">
                          {log.error_message}
                        </span>
                      )}
                      {log.trace_id && (
                        <span className="rounded-full border border-border px-2 py-0.5 font-mono">
                          trace:{log.trace_id}
                        </span>
                      )}
                      {log.span_id && (
                        <span className="rounded-full border border-border px-2 py-0.5 font-mono">
                          span:{log.span_id}
                        </span>
                      )}
                    </div>
                  </article>
                ))}
                {incident.normalizedLogs.length === 0 && (
                  <div className="rounded-xl border border-dashed border-border/70 bg-muted/30 p-4 text-sm text-muted-foreground">
                    Tidak ada log terkurasi untuk ditampilkan.
                  </div>
                )}
              </div>
            </TabsContent>
            <TabsContent value="raw">
              <div className="mt-4 max-h-80 space-y-3 overflow-y-auto pr-2">
                {incident.rawLogs.map((log, idx) => (
                  <pre
                    key={`${log.timestamp}-${idx}`}
                    className="overflow-x-auto rounded-xl border border-border bg-card p-4 text-xs font-mono text-emerald-600 whitespace-pre-wrap dark:text-emerald-200"
                  >
                    {JSON.stringify(log, null, 2)}
                  </pre>
                ))}
                {incident.rawLogs.length === 0 && (
                  <div className="rounded-xl border border-dashed border-border/70 bg-muted/30 p-4 text-sm text-muted-foreground">
                    Tidak ada log mentah untuk incident ini.
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
          <Separator className="my-4 opacity-20" />
          <p className="text-xs text-muted-foreground">
            Log disusun terbaru → lama untuk memudahkan pencocokan dengan
            timeline SigNoz.
          </p>
        </div>
      </CollapsibleSection>
    </div>
  );
}
