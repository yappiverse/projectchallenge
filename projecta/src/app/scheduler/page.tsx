"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";

import ThemeSelector from "@/components/theme/ThemeSelector";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import type {
  ScheduleAnchor,
  ScheduleDuration,
  ScheduleMode,
  ScheduleRecord,
} from "@/lib/scheduler/types";

// ---------------- types ----------------
type Mode = ScheduleMode;
type Duration = ScheduleDuration;
type AlignedTime = ScheduleAnchor;

type QuickPreset = Readonly<{
  label: string;
  note: string;
  value: Duration;
}>;

// ---------------- constants ----------------
const DEFAULT_DURATION: Duration = {
  years: 0,
  months: 0,
  days: 0,
  hours: 1,
  minutes: 0,
};

const DEFAULT_ALIGNED_TIME: AlignedTime = { hour: 0, minute: 0, second: 0 };

const MAX = {
  years: 10,
  months: 11,
  days: 31,
  hours: 23,
  minutes: 59,
  hour: 23,
  minute: 59,
  second: 59,
} as const;

const QUICK_PRESETS: QuickPreset[] = [
  {
    label: "Every 15 min",
    note: "For near real-time remediation",
    value: { years: 0, months: 0, days: 0, hours: 0, minutes: 15 },
  },
  {
    label: "Hourly",
    note: "Great for ingestion batches",
    value: { years: 0, months: 0, days: 0, hours: 1, minutes: 0 },
  },
  {
    label: "Daily",
    note: "Standard compliance sampling",
    value: { years: 0, months: 0, days: 1, hours: 0, minutes: 0 },
  },
  {
    label: "Weekly",
    note: "For heavier cost windows",
    value: { years: 0, months: 0, days: 7, hours: 0, minutes: 0 },
  },
];

const MODE_COPY: Record<
  Mode,
  { title: string; description: string; badge: string }
> = {
  relative: {
    title: "Self-paced cadence",
    description: "Start the next run as soon as the previous one closes.",
    badge: "Async",
  },
  aligned: {
    title: "Calendar aligned",
    description: "Pin runs to a wall-clock anchor for stakeholder visibility.",
    badge: "Clock",
  },
};

// ---------------- helpers ----------------
function clampInt(n: number, min: number, max: number) {
  if (!Number.isFinite(n)) return min;
  return Math.min(max, Math.max(min, Math.trunc(n)));
}

function isEmptyDuration(d: Duration) {
  return !d.years && !d.months && !d.days && !d.hours && !d.minutes;
}

function addDuration(date: Date, d: Duration) {
  const next = new Date(date);
  next.setFullYear(next.getFullYear() + d.years);
  next.setMonth(next.getMonth() + d.months);
  next.setDate(next.getDate() + d.days);
  next.setHours(next.getHours() + d.hours);
  next.setMinutes(next.getMinutes() + d.minutes);
  return next;
}

function formatDuration(d: Duration) {
  const parts: string[] = [];
  if (d.years) parts.push(`${d.years} year${d.years === 1 ? "" : "s"}`);
  if (d.months) parts.push(`${d.months} month${d.months === 1 ? "" : "s"}`);
  if (d.days) parts.push(`${d.days} day${d.days === 1 ? "" : "s"}`);
  if (d.hours) parts.push(`${d.hours} hour${d.hours === 1 ? "" : "s"}`);
  if (d.minutes) parts.push(`${d.minutes} min`);
  return parts.join(" ") || "—";
}

function formatDateTime(d: Date) {
  return d.toLocaleString("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
}

function formatIsoTimestamp(value?: string | null) {
  if (!value) return "—";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "—";
  return formatDateTime(parsed);
}

function formatClock(time: AlignedTime) {
  const pad = (v: number) => v.toString().padStart(2, "0");
  return `${pad(time.hour)}:${pad(time.minute)}:${pad(time.second)}`;
}

// ---------------- main ----------------
export default function ScheduleSelector() {
  const [mode, setMode] = useState<Mode>("relative");
  const [duration, setDuration] = useState<Duration>(DEFAULT_DURATION);

  const [useMidnight, setUseMidnight] = useState(true);
  const [alignedTime, setAlignedTime] =
    useState<AlignedTime>(DEFAULT_ALIGNED_TIME);

  const anchorClock = useMidnight ? DEFAULT_ALIGNED_TIME : alignedTime;
  const [schedules, setSchedules] = useState<ScheduleRecord[]>([]);
  const [loadingSchedules, setLoadingSchedules] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadSchedules = useCallback(async () => {
    setLoadingSchedules(true);
    try {
      const response = await fetch("/api/schedules", { cache: "no-store" });
      const json = await response.json();
      if (!response.ok || !json?.ok) {
        throw new Error(json?.error ?? "Failed to load schedules");
      }
      setErrorMessage(null);
      setSchedules(json.schedules ?? []);
    } catch (err) {
      console.error("[scheduler] failed to load", err);
      setErrorMessage("Tidak bisa memuat jadwal tersimpan");
    } finally {
      setLoadingSchedules(false);
    }
  }, []);

  useEffect(() => {
    loadSchedules();
  }, [loadSchedules]);

  const preview = useMemo(() => {
    if (isEmptyDuration(duration)) return null;

    const base = new Date();
    if (mode === "aligned") {
      base.setHours(
        anchorClock.hour,
        anchorClock.minute,
        anchorClock.second,
        0
      );
    }

    const next = addDuration(base, duration);
    const timeline: Array<{ label: string; time: string }> = [];
    let cursor = new Date(next);
    for (let i = 0; i < 4; i += 1) {
      timeline.push({ label: `Run ${i + 1}`, time: formatDateTime(cursor) });
      cursor = addDuration(cursor, duration);
    }

    return {
      title:
        mode === "relative"
          ? "Runs after each completion"
          : "Runs on a fixed clock",
      subtitle: formatDuration(duration),
      time: formatDateTime(next),
      timeline,
    };
  }, [mode, duration, anchorClock]);

  const handleSave = useCallback(async () => {
    if (!preview) return;
    setSaving(true);
    setStatusMessage(null);
    setErrorMessage(null);
    try {
      const response = await fetch("/api/schedules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: preview.title,
          mode,
          duration,
          anchor: mode === "aligned" ? anchorClock : undefined,
        }),
      });
      const json = await response.json();
      if (!response.ok || !json?.ok) {
        throw new Error(json?.error ?? "Failed to save schedule");
      }
      setStatusMessage(`Jadwal "${json.schedule?.name ?? "baru"}" tersimpan`);
      await loadSchedules();
    } catch (err) {
      console.error("[scheduler] failed to save", err);
      setErrorMessage((err as Error).message);
    } finally {
      setSaving(false);
    }
  }, [anchorClock, duration, loadSchedules, mode, preview]);

  const handleDelete = useCallback(
    async (id: string) => {
      setDeletingId(id);
      setErrorMessage(null);
      try {
        const response = await fetch(`/api/schedules/${id}`, {
          method: "DELETE",
        });
        const json = await response.json().catch(() => ({ ok: response.ok }));
        if (!response.ok || !json?.ok) {
          throw new Error(json?.error ?? "Failed to delete schedule");
        }
        await loadSchedules();
      } catch (err) {
        console.error("[scheduler] failed to delete", err);
        setErrorMessage((err as Error).message);
      } finally {
        setDeletingId(null);
      }
    },
    [loadSchedules]
  );

  const updateDuration = useCallback((key: keyof Duration, value: number) => {
    const max = MAX[key];
    setDuration((d) => ({ ...d, [key]: clampInt(value, 0, max) }));
  }, []);

  const isPresetActive = useCallback(
    (p: Duration) =>
      duration.years === p.years &&
      duration.months === p.months &&
      duration.days === p.days &&
      duration.hours === p.hours &&
      duration.minutes === p.minutes,
    [duration]
  );

  const anchorSummary =
    mode === "aligned"
      ? `${formatClock(anchorClock)} anchor`
      : "Anchored to previous completion";

  const insightCards = preview
    ? [
        { label: "Next run", value: preview.time, hint: "Local timezone" },
        {
          label: "Cadence",
          value: preview.subtitle,
          hint: "Interval between runs",
        },
        { label: "Anchor", value: anchorSummary, hint: MODE_COPY[mode].badge },
      ]
    : [
        {
          label: "Next run",
          value: "Waiting for interval",
          hint: "Add cadence first",
        },
        { label: "Cadence", value: "—", hint: "Mix years to minutes" },
        { label: "Anchor", value: anchorSummary, hint: MODE_COPY[mode].badge },
      ];

  const strategyNote =
    mode === "relative"
      ? "Ideal when downstream tasks emit completion events—keeps throughput adaptive."
      : "Use this when stakeholders expect deliverables at predictable wall-clock slots.";

  return (
    <div className="relative isolate min-h-screen bg-linear-to-b from-background via-background to-background/60">
      <div className="mx-auto flex max-w-max flex-col gap-8 px-4 pb-16 pt-12 sm:px-6 lg:px-8">
        <header className="flex flex-wrap items-center justify-between gap-6">
          <div className="space-y-3">
            <Badge variant="outline" className="rounded-full px-3 py-1 text-xs">
              Automation Studio
            </Badge>
            <div>
              <h1 className="text-3xl font-semibold">
                Design a resilient schedule
              </h1>
              <p className="text-sm text-muted-foreground">
                Blend relative cadences with fixed anchors so incident
                responders know when to expect the next run.
              </p>
            </div>
          </div>
          <ThemeSelector variant="floating" />
        </header>

        <section className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)]">
          <Card className="border-none bg-card/60 shadow-2xl ring-1 ring-border/60">
            <CardContent className="space-y-8 p-6 sm:p-8">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="space-y-1">
                  <h2 className="text-2xl font-semibold">
                    Scheduler blueprint
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Tweak cadence knobs and watch the simulation update
                    instantly.
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs uppercase text-muted-foreground">
                    Mode
                  </p>
                  <p className="text-sm font-semibold">
                    {MODE_COPY[mode].badge}
                  </p>
                </div>
              </div>

              <Tabs value={mode} onValueChange={(v) => setMode(v as Mode)}>
                <TabsList className="grid w-full grid-cols-2 rounded-2xl bg-muted/50 p-1">
                  <TabsTrigger value="relative" className="rounded-xl text-sm">
                    After last run
                  </TabsTrigger>
                  <TabsTrigger value="aligned" className="rounded-xl text-sm">
                    Fixed clock time
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="relative" className="space-y-6 pt-6">
                  <ModePanel copy={MODE_COPY.relative} />
                  <SectionHeader
                    title="Quick presets"
                    description="Use curated cadences as a starting point."
                  />
                  <div className="grid gap-3 md:grid-cols-2">
                    {QUICK_PRESETS.map((preset) => (
                      <PresetButton
                        key={preset.label}
                        label={preset.label}
                        note={preset.note}
                        active={isPresetActive(preset.value)}
                        onClick={() => setDuration(preset.value)}
                      />
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="aligned" className="space-y-6 pt-6">
                  <ModePanel copy={MODE_COPY.aligned} />
                  <SectionHeader
                    title="Anchor time"
                    description="Choose the exact 24-hour slot that launches the cadence."
                  />
                  <div className="flex flex-wrap items-center gap-3">
                    <Chip
                      active={useMidnight}
                      onClick={() => setUseMidnight(true)}
                    >
                      Midnight anchor
                    </Chip>
                    <Chip
                      active={!useMidnight}
                      onClick={() => setUseMidnight(false)}
                    >
                      Custom time
                    </Chip>
                    <Badge variant="glow" className="rounded-full">
                      {formatClock(anchorClock)}
                    </Badge>
                  </div>

                  {!useMidnight && (
                    <div className="flex flex-wrap gap-4 rounded-2xl border border-border/60 bg-background/80 px-4 py-3">
                      <TimeField
                        label="HH"
                        value={alignedTime.hour}
                        max={MAX.hour}
                        onChange={(v) =>
                          setAlignedTime((t) => ({ ...t, hour: v }))
                        }
                      />
                      <TimeField
                        label="MM"
                        value={alignedTime.minute}
                        max={MAX.minute}
                        onChange={(v) =>
                          setAlignedTime((t) => ({ ...t, minute: v }))
                        }
                      />
                      <TimeField
                        label="SS"
                        value={alignedTime.second}
                        max={MAX.second}
                        onChange={(v) =>
                          setAlignedTime((t) => ({ ...t, second: v }))
                        }
                      />
                    </div>
                  )}

                  <SectionHeader
                    title="Quick presets"
                    description="Pair an aligned anchor with a cadence."
                  />
                  <div className="grid gap-3 md:grid-cols-2">
                    {QUICK_PRESETS.map((preset) => (
                      <PresetButton
                        key={preset.label}
                        label={preset.label}
                        note={preset.note}
                        active={isPresetActive(preset.value)}
                        onClick={() => setDuration(preset.value)}
                      />
                    ))}
                  </div>
                </TabsContent>
              </Tabs>

              <SectionHeader
                title="Fine-tune interval"
                description="Combine long and short units for the exact pacing you need."
              />
              <div className="grid gap-3 md:grid-cols-2">
                <Stepper
                  label="Years"
                  value={duration.years}
                  max={MAX.years}
                  onChange={(v) => updateDuration("years", v)}
                />
                <Stepper
                  label="Months"
                  value={duration.months}
                  max={MAX.months}
                  onChange={(v) => updateDuration("months", v)}
                />
                <Stepper
                  label="Days"
                  value={duration.days}
                  max={MAX.days}
                  onChange={(v) => updateDuration("days", v)}
                />
                <Stepper
                  label="Hours"
                  value={duration.hours}
                  max={MAX.hours}
                  onChange={(v) => updateDuration("hours", v)}
                />
                <Stepper
                  label="Minutes"
                  value={duration.minutes}
                  max={MAX.minutes}
                  onChange={(v) => updateDuration("minutes", v)}
                />
              </div>

              <div className="rounded-3xl border border-dashed border-primary/40 bg-primary/5 px-5 py-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold">Human summary</p>
                    <p className="text-xs text-muted-foreground">
                      {preview
                        ? preview.subtitle
                        : "Select a preset to generate a cadence"}
                    </p>
                  </div>
                  <Badge variant="outline" className="rounded-full">
                    Live preview
                  </Badge>
                </div>
                <p className="mt-3 text-sm text-muted-foreground">
                  {strategyNote}
                </p>
              </div>

              <Button
                size="lg"
                className="w-full"
                disabled={!preview || saving}
                onClick={handleSave}
              >
                {saving
                  ? "Saving cadence..."
                  : mode === "relative"
                  ? "Save flexible cadence"
                  : "Save aligned cadence"}
              </Button>
              {(statusMessage || errorMessage) && (
                <p
                  className={cn(
                    "text-sm",
                    errorMessage ? "text-destructive" : "text-muted-foreground"
                  )}
                >
                  {errorMessage ?? statusMessage}
                </p>
              )}
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card className="border-none bg-card/80 shadow-xl ring-1 ring-border/60">
              <CardContent className="space-y-6 p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs uppercase text-muted-foreground">
                      Simulation
                    </p>
                    <h3 className="text-2xl font-semibold">
                      {preview ? preview.title : "Waiting for inputs"}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {preview
                        ? "Next run forecast"
                        : "Add an interval to see the projection"}
                    </p>
                  </div>
                  <Badge
                    variant={preview ? "glow" : "outline"}
                    className="rounded-full"
                  >
                    {preview ? "Preview" : "Idle"}
                  </Badge>
                </div>

                {preview ? (
                  <div className="rounded-2xl border border-border/60 bg-background/80 px-4 py-4 text-center">
                    <p className="text-xs uppercase text-muted-foreground">
                      Next run
                    </p>
                    <p className="text-lg font-semibold">{preview.time}</p>
                  </div>
                ) : (
                  <div
                    className="h-20 rounded-2xl border border-dashed border-border/60 bg-muted/40"
                    aria-hidden
                  />
                )}

                <div className="grid gap-3 md:grid-cols-3">
                  {insightCards.map((card) => (
                    <InfoStat key={card.label} {...card} />
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="border-none bg-card/80 shadow-xl ring-1 ring-border/60">
              <CardContent className="space-y-5 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs uppercase text-muted-foreground">
                      Runbook
                    </p>
                    <h3 className="text-lg font-semibold">Next executions</h3>
                  </div>
                  <Badge variant="outline" className="rounded-full">
                    {mode === "relative" ? "Adaptive" : "Pinned"}
                  </Badge>
                </div>

                {preview ? (
                  <div className="space-y-3">
                    {preview.timeline.map((entry, idx) => (
                      <div
                        key={entry.time}
                        className="flex items-center gap-4 rounded-2xl bg-muted/40 px-4 py-3 ring-1 ring-border/60"
                      >
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-background text-sm font-semibold">
                          {idx + 1}
                        </div>
                        <div>
                          <p className="font-medium">{entry.time}</p>
                          <p className="text-xs text-muted-foreground">
                            {mode === "relative"
                              ? "Follows completion drift"
                              : "Locked to calendar anchor"}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Add an interval to generate a four-run projection.
                  </p>
                )}
              </CardContent>
            </Card>

            <SavedSchedulesCard
              schedules={schedules}
              loading={loadingSchedules}
              onDelete={handleDelete}
              deletingId={deletingId}
            />
          </div>
        </section>
      </div>
    </div>
  );
}

function SavedSchedulesCard({
  schedules,
  loading,
  deletingId,
  onDelete,
}: {
  schedules: ScheduleRecord[];
  loading: boolean;
  deletingId: string | null;
  onDelete: (id: string) => void;
}) {
  return (
    <Card className="border-none bg-card/80 shadow-xl ring-1 ring-border/60">
      <CardContent className="space-y-4 p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase text-muted-foreground">Scheduler</p>
            <h3 className="text-lg font-semibold">Saved cadences</h3>
          </div>
          <Badge variant="outline" className="rounded-full">
            {loading ? "Loading" : `${schedules.length} active`}
          </Badge>
        </div>

        {loading ? (
          <p className="text-sm text-muted-foreground">
            Fetching saved runs...
          </p>
        ) : schedules.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Belum ada jadwal yang disimpan.
          </p>
        ) : (
          <div className="space-y-3">
            {schedules.map((schedule) => (
              <div
                key={schedule.id}
                className="rounded-2xl border border-border/60 bg-background/80 p-4"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold">{schedule.name}</p>
                    <p className="text-xs text-muted-foreground">
                      Next run: {formatIsoTimestamp(schedule.nextRunAt)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Last window:{" "}
                      {formatIsoTimestamp(schedule.lastRange?.start)} {"->"}{" "}
                      {formatIsoTimestamp(schedule.lastRange?.end)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Window length: {formatDuration(schedule.duration)}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <Badge variant="glow" className="rounded-full">
                      {schedule.mode === "relative" ? "Async" : "Clock"}
                    </Badge>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onDelete(schedule.id)}
                      disabled={deletingId === schedule.id}
                    >
                      {deletingId === schedule.id ? "Removing..." : "Remove"}
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ---------------- UI atoms ----------------
function Stepper({
  label,
  value,
  max,
  onChange,
}: {
  label: string;
  value: number;
  max: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl border border-border/60 bg-background/80 px-4 py-3">
      <span className="w-24 text-sm font-medium">{label}</span>

      <input
        type="number"
        min={0}
        max={max}
        value={value}
        onChange={(e) => {
          const raw = e.currentTarget.value;
          if (raw === "") return onChange(0);
          onChange(clampInt(Number(raw), 0, max));
        }}
        className="w-28 rounded-md border px-2 py-1 text-sm"
        aria-label={`${label} value`}
      />

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="icon"
          onClick={() => onChange(clampInt(value - 1, 0, max))}
        >
          −
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={() => onChange(clampInt(value + 1, 0, max))}
        >
          +
        </Button>
      </div>
    </div>
  );
}

function TimeField({
  label,
  value,
  max,
  onChange,
}: {
  label: string;
  value: number;
  max: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex flex-col gap-1">
      <Label className="text-xs uppercase tracking-wide text-muted-foreground">
        {label}
      </Label>
      <input
        type="number"
        min={0}
        max={max}
        value={value}
        onChange={(e) => {
          const raw = e.currentTarget.value;
          if (raw === "") return onChange(0);
          onChange(clampInt(Number(raw), 0, max));
        }}
        className="w-20 rounded-md border px-2 py-1 text-sm"
      />
    </div>
  );
}

function Chip({
  active,
  children,
  onClick,
}: {
  active?: boolean;
  children: ReactNode;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full border px-4 py-1.5 text-sm font-semibold tracking-wide transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
        active
          ? "border-primary bg-primary text-primary-foreground shadow-lg"
          : "border-border/70 text-muted-foreground hover:bg-muted"
      )}
    >
      {children}
    </button>
  );
}

function SectionHeader({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div>
      <p className="text-sm font-semibold">{title}</p>
      <p className="text-xs text-muted-foreground">{description}</p>
    </div>
  );
}

function ModePanel({
  copy,
}: {
  copy: { title: string; description: string; badge: string };
}) {
  return (
    <div className="rounded-2xl border border-border/60 bg-background/80 px-4 py-4">
      <div className="flex items-center gap-2">
        <Badge variant="glow" className="rounded-full">
          {copy.badge}
        </Badge>
        <p className="text-sm font-semibold">{copy.title}</p>
      </div>
      <p className="mt-2 text-sm text-muted-foreground">{copy.description}</p>
    </div>
  );
}

function PresetButton({
  label,
  note,
  active,
  onClick,
}: Pick<QuickPreset, "label" | "note"> & {
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "rounded-2xl border px-4 py-3 text-left transition",
        active
          ? "border-primary bg-primary/10 shadow-lg"
          : "border-border/60 bg-background/60 hover:border-primary/60"
      )}
    >
      <p className="text-sm font-semibold">{label}</p>
      <p className="text-xs text-muted-foreground">{note}</p>
    </button>
  );
}

function InfoStat({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <div className="rounded-2xl border border-border/60 bg-background/80 px-3 py-3">
      <p className="text-xs uppercase text-muted-foreground">{label}</p>
      <p className="text-sm font-semibold">{value}</p>
      <p className="text-xs text-muted-foreground">{hint}</p>
    </div>
  );
}
