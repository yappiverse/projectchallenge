"use client";

import type { IncidentRecord } from "@/lib/incident/storage";
import {
  formatDateTime,
  timeAgo,
  getSeverityPalette,
  formatIncidentSeverity,
  incidentMatchesSeverity,
  getIncidentSeveritySpectrum,
  describeSeverityLabel,
  type SeverityKey,
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
import { Search, XCircle } from "lucide-react";

interface IncidentListProps {
  incidents: IncidentRecord[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

interface FilterOption {
  key: SeverityKey;
  label: string;
  match: (incident: IncidentRecord) => boolean;
}

const truncate = (value: string, max = 120): string => {
  if (!value) return "(ringkasan kosong)";
  return value.length > max ? `${value.slice(0, max)}…` : value;
};

const matchesSeverity = (
  incident: IncidentRecord,
  severity: SeverityKey
): boolean => {
  if (incidentMatchesSeverity(incident, severity)) {
    return true;
  }
  const spectrum = getIncidentSeveritySpectrum(incident);
  return spectrum.includes(severity);
};

const FILTER_OPTIONS: FilterOption[] = [
  {
    key: "fatal",
    label: "Fatal",
    match: (incident) => matchesSeverity(incident, "fatal"),
  },
  {
    key: "error",
    label: "Error",
    match: (incident) => matchesSeverity(incident, "error"),
  },
  {
    key: "warn",
    label: "Warn",
    match: (incident) => matchesSeverity(incident, "warn"),
  },
  {
    key: "info",
    label: "Info",
    match: (incident) => matchesSeverity(incident, "info"),
  },
  {
    key: "scheduler",
    label: "Scheduler",
    match: (incident) =>
      matchesSeverity(incident, "scheduler") ||
      (incident.payload?.receiver ?? "").toLowerCase() === "scheduler",
  },
];

type TraceableLogRow = {
  trace_id?: string | number | null;
};

const extractTraceId = (row: unknown): string | null => {
  if (!row || typeof row !== "object") {
    return null;
  }

  const traceId = (row as TraceableLogRow).trace_id;

  if (typeof traceId === "string") {
    return traceId;
  }

  if (typeof traceId === "number") {
    return traceId.toString();
  }

  return null;
};

export default function IncidentList({
  incidents,
  selectedId,
  onSelect,
}: IncidentListProps) {
  const [activeFilterKeys, setActiveFilterKeys] = useState<SeverityKey[]>([]);
  const [traceFilter, setTraceFilter] = useState<string>("");
  const totalNormalized = incidents.reduce(
    (acc, incident) => acc + incident.normalizedLogs.length,
    0
  );

  const activeFilters = useMemo(() => {
    if (!activeFilterKeys.length) return [];
    return FILTER_OPTIONS.filter((option) =>
      activeFilterKeys.includes(option.key)
    );
  }, [activeFilterKeys]);

  const activeFilterLabel = useMemo(() => {
    if (!activeFilters.length) return null;
    return activeFilters.map((option) => option.label).join(" + ");
  }, [activeFilters]);

  const filteredIncidents = useMemo(() => {
    const traceQ = traceFilter.trim().toLowerCase();

    return incidents.filter((incident) => {
      if (activeFilters.length) {
        const matchesAnyFilter = activeFilters.some((option) =>
          option.match(incident)
        );
        if (!matchesAnyFilter) {
          return false;
        }
      }

      if (!traceQ) {
        return true;
      }

      const matchesInNormalized = incident.normalizedLogs.some((log) =>
        Boolean(log.trace_id && log.trace_id.toLowerCase().includes(traceQ))
      );

      const matchesInRaw = Array.isArray(incident.rawLogs)
        ? (incident.rawLogs as unknown[]).some((row) => {
            const traceId = extractTraceId(row);
            return Boolean(traceId && traceId.toLowerCase().includes(traceQ));
          })
        : false;

      return matchesInNormalized || matchesInRaw;
    });
  }, [incidents, activeFilters, traceFilter]);

  const activeCount = filteredIncidents.length;

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
        <div className="flex flex-wrap items-center gap-2">
          {FILTER_OPTIONS.map((option) => {
            const active = activeFilterKeys.includes(option.key);
            return (
              <button
                key={option.key}
                type="button"
                onClick={() =>
                  setActiveFilterKeys((prev) =>
                    prev.includes(option.key)
                      ? prev.filter((key) => key !== option.key)
                      : [...prev, option.key]
                  )
                }
                aria-pressed={active}
                className={cn(
                  "rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.25em] transition-colors",
                  active
                    ? "border-primary bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary-foreground"
                    : "border-border text-muted-foreground hover:border-primary/40 hover:text-foreground"
                )}
              >
                {option.label}
              </button>
            );
          })}
          {activeFilterKeys.length > 0 && (
            <button
              type="button"
              onClick={() => setActiveFilterKeys([])}
              className="inline-flex items-center gap-1 rounded-full border border-border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.25em] text-muted-foreground transition hover:border-destructive/50 hover:text-destructive"
            >
              <XCircle className="h-3.5 w-3.5" />
              Clear
            </button>
          )}
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
        {filteredIncidents.length === 0 ? (
          <div className="flex h-56 flex-col items-center justify-center gap-3 text-center text-muted-foreground">
            <Badge
              variant="outline"
              className="text-[10px] uppercase tracking-[0.3em]"
            >
              {activeFilterLabel
                ? `Filter ${activeFilterLabel}`
                : "Menunggu data"}
            </Badge>
            <p className="text-xl font-semibold text-foreground">
              Belum ada data
            </p>
            <p className="text-sm text-muted-foreground">
              {activeFilterLabel
                ? "Tidak ada incident yang cocok dengan kombinasi filter ini."
                : "Kirim payload webhook dari Alertmanager untuk mengisi timeline."}
            </p>
          </div>
        ) : (
          <ScrollArea className="h-[72vh]">
            <ul className="divide-y divide-border/60">
              {filteredIncidents.map((incident) => {
                const isSelected = incident.id === selectedId;
                const { label: severityLabel, primary: paletteKey } =
                  formatIncidentSeverity(incident);
                const palette = getSeverityPalette(paletteKey);
                const severitySpectrum = getIncidentSeveritySpectrum(incident);
                const combinedLabel =
                  severitySpectrum.length > 1
                    ? severitySpectrum
                        .map((key) => describeSeverityLabel(key))
                        .join(" / ")
                    : severityLabel;
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
                          <div className="flex items-center gap-1">
                            {severitySpectrum.map((key) => (
                              <span
                                key={`${incident.id}-${key}`}
                                className={`h-2 w-2 rounded-full ${
                                  getSeverityPalette(key).dot
                                }`}
                              />
                            ))}
                          </div>
                          <span>{combinedLabel}</span>
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
