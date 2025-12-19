"use client";

import { Monitor, MoonStar, SunMedium } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";

const themeOptions = [
  { label: "Light", value: "light", icon: SunMedium },
  { label: "Dark", value: "dark", icon: MoonStar },
  { label: "System", value: "system", icon: Monitor },
];

interface ThemeSelectorProps {
  className?: string;
}

export default function ThemeSelector({ className }: ThemeSelectorProps) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const frameId = window.requestAnimationFrame(() => setMounted(true));

    return () => {
      window.cancelAnimationFrame(frameId);
    };
  }, []);

  if (!mounted) {
    return (
      <div
        className={cn(
          "h-11 w-[280px] animate-pulse rounded-full border border-border/40 bg-muted/60",
          className
        )}
        aria-hidden
      />
    );
  }

  const selection = theme ?? "system";

  return (
    <div
      className={cn(
        "flex items-center gap-1 rounded-full border border-border/60 bg-card/80 px-1 py-1 text-[11px] font-semibold uppercase tracking-[0.25em] text-muted-foreground shadow-[0_12px_35px_rgba(15,23,42,0.08)] ring-1 ring-border/50 backdrop-blur-xl",
        className
      )}
    >
      <span className="sr-only">Pilih tema dashboard</span>
      <div className="flex items-center gap-1">
        {themeOptions.map(({ label, value, icon: Icon }) => {
          const isActive = selection === value;
          return (
            <button
              key={value}
              type="button"
              onClick={() => setTheme(value)}
              aria-pressed={isActive}
              className={cn(
                "relative flex min-w-24 flex-1 items-center justify-center gap-2 rounded-full px-3 py-1.5 text-[11px] tracking-[0.08em] transition-all",
                isActive
                  ? "bg-linear-to-r from-primary to-primary/80 text-primary-foreground shadow-md"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className="h-4 w-4" aria-hidden />
              <span>{label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
