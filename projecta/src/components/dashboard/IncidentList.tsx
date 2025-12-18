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
  const totalNormalized = incidents.reduce(
    (acc, incident) => acc + incident.normalizedLogs.length,
    0
  );

  const filteredIncidents = useMemo(() => {
    if (!severityFilter) return incidents;
    return incidents.filter((incident) => {
      const severity =
        incident.normalizedLogs[0]?.severity ??
        incident.payload?.commonLabels?.severity;
      return severity?.toLowerCase() === severityFilter;
    });
  }, [incidents, severityFilter]);

  const available = severityFilter ? filteredIncidents : incidents;

  const activeCount = available.length;

  return (
    <Card className="border-white/10 bg-[#0a0c10] text-slate-100">
      <CardHeader className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            <p className="text-[10px] uppercase tracking-[0.3em] text-slate-500">
              Incident timeline
            </p>
            <CardTitle className="text-2xl">Live feed</CardTitle>
            <CardDescription className="text-sm text-slate-400">
              Pilih item untuk membuka detail, log, dan ringkasan Gemini.
            </CardDescription>
          </div>
          <Badge
            variant="outline"
            className="w-fit border-white/15 text-[10px] tracking-[0.3em] text-slate-300"
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
                  "rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.25em] transition",
                  active
                    ? "border-white/50 bg-white/5 text-slate-100"
                    : "border-white/10 text-slate-400 hover:border-white/25 hover:text-slate-100"
                )}
              >
                {value}
              </button>
            );
          })}
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {available.length === 0 ? (
          <div className="flex h-56 flex-col items-center justify-center gap-3 text-center text-slate-400">
            <Badge
              variant="outline"
              className="text-[10px] uppercase tracking-[0.3em]"
            >
              {severityFilter ? `Filter ${severityFilter}` : "Menunggu data"}
            </Badge>
            <p className="text-xl font-semibold text-white">Belum ada data</p>
            <p className="text-sm text-slate-500">
              {severityFilter
                ? "Tidak ada incident yang cocok dengan filter ini."
                : "Kirim payload webhook dari Alertmanager untuk mengisi timeline."}
            </p>
          </div>
        ) : (
          <ScrollArea className="h-[72vh]">
            <ul className="divide-y divide-white/5">
              {available.map((incident) => {
                const isSelected = incident.id === selectedId;
                const severity =
                  incident.normalizedLogs[0]?.severity ??
                  incident.payload?.commonLabels?.severity;
                const palette = getSeverityPalette(severity);
                return (
                  <li key={incident.id}>
                    <button
                      type="button"
                      onClick={() => onSelect(incident.id)}
                      className={cn(
                        "w-full space-y-2 rounded-none px-5 py-4 text-left transition",
                        isSelected
                          ? `bg-white/5 ${palette.glow}`
                          : "hover:bg-white/5"
                      )}
                    >
                      <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.3em] text-slate-500">
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
                        <span className="font-semibold text-slate-100">
                          {incident.payload.commonLabels?.alertname ??
                            "Generic alert"}
                        </span>
                      </div>
                      <p className="text-sm text-slate-300">
                        {truncate(incident.summaryText)}
                      </p>
                      <div className="flex flex-wrap gap-4 text-[10px] uppercase tracking-[0.3em] text-slate-500">
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

      <CardContent className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
        <span>Total curated log entries: {totalNormalized}</span>
        <span>Timeline otomatis terbaru → lama</span>
      </CardContent>
    </Card>
  );
}
