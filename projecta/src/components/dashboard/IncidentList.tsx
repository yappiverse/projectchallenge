"use client";

import type { IncidentRecord } from "@/lib/incident/storage";
import {
  formatDateTime,
  timeAgo,
  getSeverityPalette,
} from "@/components/dashboard/helpers";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { useMemo, useState } from "react";
import { Search } from "lucide-react";

interface IncidentListProps {
  incidents: IncidentRecord[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

const truncate = (value: string, max = 120): string => {
  if (!value) return "(ringkasan kosong)";
  return value.length > max ? `${value.slice(0, max)}…` : value;
};

export default function IncidentList({
  incidents,
  selectedId,
  onSelect,
}: IncidentListProps) {
  const [severityFilter, setSeverityFilter] = useState<string | null>(null);
  const [traceFilter, setTraceFilter] = useState<string>("");
  const totalNormalized = incidents.reduce(
    (acc, incident) => acc + incident.normalizedLogs.length,
    0
  );

  const filteredIncidents = useMemo(() => {
    const traceQ = traceFilter.trim().toLowerCase();

    return incidents.filter((incident) => {
      const severity =
        incident.normalizedLogs[0]?.severity ??
        incident.payload?.commonLabels?.severity;

      if (severityFilter && severity?.toLowerCase() !== severityFilter) {
        return false;
      }

      if (!traceQ) return true;

      const matchesInNormalized = incident.normalizedLogs.some((log) =>
        Boolean(log.trace_id && log.trace_id.toLowerCase().includes(traceQ))
      );

      const matchesInRaw =
        incident.rawLogs && Array.isArray(incident.rawLogs)
          ? incident.rawLogs.some((row: any) =>
              Boolean(
                row.trace_id &&
                  String(row.trace_id).toLowerCase().includes(traceQ)
              )
            )
          : false;

      return matchesInNormalized || matchesInRaw;
    });
  }, [incidents, severityFilter, traceFilter]);

  // `filteredIncidents` already applies severity + trace filters.
  const available = filteredIncidents;

  const activeCount = available.length;

  return (
    <Card>
      <CardHeader className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
              Incident timeline
            </p>
            <CardTitle className="text-2xl text-foreground">
              Live feed
            </CardTitle>
            <CardDescription className="text-sm text-muted-foreground">
              Pilih item untuk membuka detail, log, dan ringkasan Gemini.
            </CardDescription>
          </div>
          <Badge
            variant="outline"
            className="w-fit text-[10px] tracking-[0.3em]"
          >
            {activeCount} aktif
          </Badge>
        </div>
        <div className="flex flex-wrap gap-2">
          {["fatal", "error", "warn", "info"].map((value) => {
            const active = severityFilter === value;
            return (
              <button
                key={value}
                type="button"
                onClick={() =>
                  setSeverityFilter((prev) => (prev === value ? null : value))
                }
                aria-pressed={active}
                className={cn(
                  "rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.25em] transition-colors",
                  active
                    ? "border-primary bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary-foreground"
                    : "border-border text-muted-foreground hover:border-primary/40 hover:text-foreground"
                )}
              >
                {value}
              </button>
            );
          })}
        </div>

        <div className="mb-1 flex items-center">
          <label htmlFor="trace-search" className="sr-only">
            Search by trace id
          </label>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />

            <input
              id="trace-search"
              type="text"
              value={traceFilter}
              onChange={(e) => setTraceFilter(e.target.value)}
              placeholder="Search trace id"
              className="w-[300px] rounded-md border border-border bg-background px-3 py-2 pl-10 pr-9 text-sm placeholder:text-muted-foreground outline-none transition hover:border-primary/50 focus:border-primary focus:ring-2 focus:ring-primary/30"
            />

            {traceFilter && (
              <button
                type="button"
                aria-label="Clear trace filter"
                onClick={() => setTraceFilter("")}
                className="
              absolute right-1 top-1/2 -translate-y-1/2
              inline-flex h-6 w-6 items-center justify-center
              rounded-md
              text-muted-foreground
              transition
              hover:bg-muted/20
              hover:text-foreground
            "
              >
                ×
              </button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {available.length === 0 ? (
          <div className="flex h-56 flex-col items-center justify-center gap-3 text-center text-muted-foreground">
            <Badge
              variant="outline"
              className="text-[10px] uppercase tracking-[0.3em]"
            >
              {severityFilter ? `Filter ${severityFilter}` : "Menunggu data"}
            </Badge>
            <p className="text-xl font-semibold text-foreground">
              Belum ada data
            </p>
            <p className="text-sm text-muted-foreground">
              {severityFilter
                ? "Tidak ada incident yang cocok dengan filter ini."
                : "Kirim payload webhook dari Alertmanager untuk mengisi timeline."}
            </p>
          </div>
        ) : (
          <ScrollArea className="h-[72vh]">
            <ul className="divide-y divide-border/60">
              {available.map((incident) => {
                const isSelected = incident.id === selectedId;
                const severity =
                  incident.normalizedLogs[0]?.severity ??
                  incident.payload?.commonLabels?.severity;
                const palette = getSeverityPalette(severity);
                return (
                  <li key={incident.id} className="p-1">
                    <button
                      type="button"
                      onClick={() => onSelect(incident.id)}
                      className={cn(
                        "group relative w-full space-y-2 rounded-2xl border border-transparent px-6 py-4 text-left transition-all",
                        isSelected
                          ? `bg-linear-to-r from-primary/10 via-primary/5 to-transparent text-foreground shadow-[0_18px_35px_rgba(15,23,42,0.08)] ring-1 ring-primary/20 dark:from-primary/25 dark:via-primary/10 ${palette.glow}`
                          : "hover:border-muted/60 hover:bg-muted/30"
                      )}
                    >
                      <span
                        aria-hidden
                        className={cn(
                          "pointer-events-none absolute inset-y-3 left-3 w-1.5 rounded-full bg-transparent opacity-0 transition-all duration-200",
                          isSelected && `${palette.dot} opacity-100`
                        )}
                      />
                      <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
                        <span>{formatDateTime(incident.createdAt)}</span>
                        <span>{timeAgo(incident.createdAt)}</span>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 text-sm">
                        <Badge
                          variant="outline"
                          className={cn(
                            "flex items-center gap-2 px-3 py-1 text-[11px] tracking-normal",
                            palette.chip,
                            palette.chipText
                          )}
                        >
                          <span
                            className={`h-2 w-2 rounded-full ${palette.dot}`}
                          />
                          <span className="capitalize">
                            {severity ?? "n/a"}
                          </span>
                        </Badge>
                        <span className="font-semibold text-foreground">
                          {incident.payload.commonLabels?.alertname ??
                            "Generic alert"}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {truncate(incident.summaryText)}
                      </p>
                      <div className="flex flex-wrap gap-4 text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
                        <span>{incident.normalizedLogs.length} curated</span>
                        <span>{incident.rawLogs.length} raw</span>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          </ScrollArea>
        )}
      </CardContent>

      <Separator className="opacity-20" />

      <CardContent className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
        <span>Total curated log entries: {totalNormalized}</span>
        <span>Timeline otomatis terbaru → lama</span>
      </CardContent>
    </Card>
  );
}
