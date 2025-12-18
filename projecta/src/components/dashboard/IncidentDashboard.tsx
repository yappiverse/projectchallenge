"use client";

import { useMemo, useState } from "react";
import {
  Activity,
  Clock8,
  Logs,
  Sparkles,
  type LucideIcon,
} from "lucide-react";

import type { IncidentRecord } from "@/lib/incident/storage";
import IncidentList from "@/components/dashboard/IncidentList";
import IncidentDetails from "@/components/dashboard/IncidentDetails";
import { formatDateTime } from "@/components/dashboard/helpers";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface IncidentDashboardProps {
  incidents: IncidentRecord[];
}

interface StatCardProps {
  label: string;
  value: string;
  meta: string;
  icon: LucideIcon;
  accent: string;
}

const StatCard = ({
  label,
  value,
  meta,
  icon: Icon,
  accent,
}: StatCardProps) => (
  <div className="rounded-xl border border-white/10 bg-[#0d0f14] p-4">
    <p className="text-[10px] uppercase tracking-[0.3em] text-slate-500">
      {label}
    </p>
    <div className="mt-3 flex items-center justify-between">
      <CardTitle className="text-2xl font-semibold text-slate-100">
        {value}
      </CardTitle>
      <span
        className={cn(
          "rounded-full border border-white/15 p-2 text-slate-400",
          accent
        )}
      >
        <Icon className="h-4 w-4" />
      </span>
    </div>
    <p className="text-sm text-slate-400">{meta}</p>
  </div>
);

export default function IncidentDashboard({
  incidents,
}: IncidentDashboardProps) {
  const [selectedId, setSelectedId] = useState<string | null>(
    incidents[0]?.id ?? null
  );

  const derivedSelection = useMemo(() => {
    if (!incidents.length) return null;
    const stillExists = incidents.some(
      (incident) => incident.id === selectedId
    );
    return stillExists ? selectedId : incidents[0].id;
  }, [incidents, selectedId]);

  const stats = useMemo(() => {
    if (!incidents.length) {
      return {
        total: "0",
        latest: "-",
        success: "0%",
        logDepth: "0 / 0",
      };
    }
    const latest = incidents[0];
    const normalizedTotal = incidents.reduce(
      (acc, incident) => acc + incident.normalizedLogs.length,
      0
    );
    const rawTotal = incidents.reduce(
      (acc, incident) => acc + incident.rawLogs.length,
      0
    );
    const geminiSuccess = incidents.filter((incident) =>
      Boolean(incident.geminiResponse)
    ).length;
    const successRate = Math.round((geminiSuccess / incidents.length) * 100);
    return {
      total: incidents.length.toString(),
      latest: formatDateTime(latest.createdAt),
      success: `${successRate}%`,
      logDepth: `${normalizedTotal} curated / ${rawTotal} raw`,
    };
  }, [incidents]);

  if (!incidents.length) {
    return (
      <Card className="border-white/10 bg-[#0b0d13] p-10 text-center text-slate-100">
        <CardHeader className="space-y-3">
          <Badge
            variant="outline"
            className="mx-auto border-white/15 text-[10px] tracking-[0.3em] text-slate-300"
          >
            Awaiting alerts
          </Badge>
          <CardTitle className="text-3xl font-semibold text-slate-100">
            Belum ada incident
          </CardTitle>
          <CardDescription className="text-base text-slate-400">
            Kirim alert ke endpoint webhook agar ringkasan otomatis muncul di
            sini.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const activeIncident =
    incidents.find((incident) => incident.id === derivedSelection) ??
    incidents[0];

  const statBlueprint: StatCardProps[] = [
    {
      label: "Captured",
      value: stats.total,
      meta: "snapshot aktif",
      icon: Activity,
      accent: "bg-transparent text-slate-100",
    },
    {
      label: "Last snapshot",
      value: stats.latest,
      meta: "waktu penerimaan",
      icon: Clock8,
      accent: "bg-transparent text-slate-100",
    },
    {
      label: "Gemini success",
      value: stats.success,
      meta: "rasio respons",
      icon: Sparkles,
      accent: "bg-transparent text-slate-100",
    },
    {
      label: "Log depth",
      value: stats.logDepth,
      meta: "kurasi vs raw",
      icon: Logs,
      accent: "bg-transparent text-slate-100",
    },
  ];

  return (
    <div className="space-y-6 text-slate-100">
      <section className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-[#0a0c10] p-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-2">
          <Badge
            variant="outline"
            className="w-fit border-white/15 text-[10px] tracking-[0.3em] text-slate-300"
          >
            Incident monitor
          </Badge>
          <CardTitle className="text-3xl font-semibold text-slate-100">
            Ringkasan insiden realtime
          </CardTitle>
          <CardDescription className="text-sm text-slate-400">
            Data diambil dari webhook Alertmanager + SigNoz log query. Pilih
            entri di sebelah kiri untuk detail.
          </CardDescription>
        </div>
        <div className="flex flex-wrap gap-4 text-sm text-slate-400">
          <div>
            <p className="text-[10px] uppercase tracking-[0.3em] text-slate-500">
              Snapshot aktif
            </p>
            <p className="font-semibold text-slate-100">{stats.total}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-[0.3em] text-slate-500">
              Pembaruan terakhir
            </p>
            <p className="font-semibold text-slate-100">{stats.latest}</p>
          </div>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {statBlueprint.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </section>

      <section className="grid gap-4 lg:grid-cols-[320px,1fr]">
        <IncidentList
          incidents={incidents}
          selectedId={derivedSelection ?? activeIncident.id}
          onSelect={setSelectedId}
        />
        <IncidentDetails incident={activeIncident} />
      </section>
    </div>
  );
}
