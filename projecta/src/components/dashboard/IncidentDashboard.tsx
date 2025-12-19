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

const HeroStat = ({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  meta: string;
  accent: string;
}) => (
  <div
    className={cn(
      "rounded-2xl border border-border/60 bg-linear-to-br p-4 text-left shadow-sm w-64",
      accent
    )}
  >
    <p className="text-[10px] uppercase tracking-[0.35em] text-muted-foreground">
      {label}
    </p>
    <p className="mt-2 text-2xl font-semibold text-foreground">{value}</p>
    {/* <p className="text-sm text-muted-foreground">{meta}</p> */}
  </div>
);

const StatCard = ({
  label,
  value,
  meta,
  icon: Icon,
  accent,
}: StatCardProps) => (
  <div className="rounded-xl border border-border bg-card p-4 shadow-sm transition-colors">
    <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
      {label}
    </p>
    <div className="mt-3 flex items-center justify-between">
      <CardTitle className="text-2xl font-semibold text-foreground">
        {value}
      </CardTitle>
      <span
        className={cn(
          "rounded-full border border-border/70 bg-muted/60 p-2 text-muted-foreground transition-colors",
          accent
        )}
      >
        <Icon className="h-4 w-4" />
      </span>
    </div>
    <p className="text-sm text-muted-foreground">{meta}</p>
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
      logDepth: `${normalizedTotal} Curated / ${rawTotal} Raw`,
    };
  }, [incidents]);

  if (!incidents.length) {
    return (
      <Card className="p-10 text-center">
        <CardHeader className="space-y-3">
          <Badge
            variant="outline"
            className="mx-auto text-[10px] tracking-[0.3em]"
          >
            Awaiting alerts
          </Badge>
          <CardTitle className="text-3xl font-semibold text-foreground">
            Belum ada incident
          </CardTitle>
          <CardDescription className="text-base text-muted-foreground">
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
      accent:
        "bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-200",
    },
    {
      label: "Last snapshot",
      value: stats.latest,
      meta: "waktu penerimaan",
      icon: Clock8,
      accent:
        "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-200",
    },
    {
      label: "Gemini success",
      value: stats.success,
      meta: "rasio respons",
      icon: Sparkles,
      accent:
        "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-200",
    },
    {
      label: "Log depth",
      value: stats.logDepth,
      meta: "kurasi vs raw",
      icon: Logs,
      accent:
        "bg-slate-100 text-slate-700 dark:bg-slate-500/20 dark:text-slate-200",
    },
  ];

  return (
    <div className="space-y-6 text-foreground">
      <section className="flex flex-col gap-6 rounded-3xl border border-border bg-card/95 p-8 shadow-lg transition-colors lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-2 lg:max-w-2xl">
          <Badge
            variant="outline"
            className="w-fit text-[10px] tracking-[0.3em]"
          >
            Incident monitor
          </Badge>
          <CardTitle className="text-3xl font-semibold text-foreground">
            Ringkasan insiden realtime
          </CardTitle>
          <CardDescription className="text-sm text-muted-foreground">
            Data diambil dari webhook Alertmanager + SigNoz log query. Pilih
            entri di sebelah kiri untuk detail.
          </CardDescription>
        </div>
        <div className="grid gap-x-8 gap-y-4 sm:grid-cols-2 lg:max-w-lg">
          <HeroStat
            label="Snapshot aktif"
            value={stats.total}
            meta="incident tersimpan"
            accent="from-indigo-50 to-white dark:from-indigo-500/20 dark:to-transparent"
          />
          <HeroStat
            label="Pembaruan terakhir"
            value={stats.latest}
            meta="waktu penerimaan"
            accent="from-amber-50 to-white dark:from-amber-500/20 dark:to-transparent"
          />
          <HeroStat
            label="Gemini success"
            value={stats.success}
            meta="rasio respons"
            accent="from-emerald-50 to-white dark:from-emerald-500/15 dark:to-transparent"
          />
          <HeroStat
            label="Log depth"
            value={stats.logDepth}
            meta="kurasi vs raw"
            accent="from-slate-50 to-white dark:from-slate-500/20 dark:to-transparent"
          />
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {statBlueprint.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </section>

      <section className="grid gap-4 lg:grid-cols-[360px,minmax(0,1fr)]">
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
