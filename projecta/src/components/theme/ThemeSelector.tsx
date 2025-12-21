"use client";

import { Monitor, MoonStar, SunMedium } from "lucide-react";
import { useTheme } from "next-themes";

import { cn } from "@/lib/utils";
import { useThemeStore } from "@/lib/stores/theme";
import type { ThemeMode } from "@/lib/stores/theme";

const themeOptions = [
  { label: "Light", value: "light", icon: SunMedium },
  { label: "Dark", value: "dark", icon: MoonStar },
  { label: "System", value: "system", icon: Monitor },
] as const;

const variantStyles = {
  inline: "inline-flex",
  floating: "inline-flex w-full max-w-full sm:w-auto",
} as const;

interface ThemeSelectorProps {
  className?: string;
  variant?: keyof typeof variantStyles;
  label?: string;
}

export default function ThemeSelector({
  className,
  variant = "inline",
  label = "Pilih tema aplikasi",
}: ThemeSelectorProps) {
  const { setTheme } = useTheme();
  const selection = useThemeStore((state) => state.mode);
  const ready = useThemeStore((state) => state.ready);

  if (!ready) {
    return <ThemeSelectorSkeleton className={className} variant={variant} />;
  }

  const handleSelect = (value: ThemeMode) => {
    setTheme(value);
  };

  return (
    <div
      className={cn(
        "flex items-center gap-1 rounded-full border border-border/60 bg-card/80 px-1 py-1 text-[11px] font-semibold uppercase tracking-[0.25em] text-muted-foreground shadow-[0_12px_35px_rgba(15,23,42,0.08)] ring-1 ring-border/50 backdrop-blur-xl",
        variantStyles[variant],
        className
      )}
    >
      <span className="sr-only">{label}</span>
      <div className="flex items-center gap-1">
        {themeOptions.map(({ label: itemLabel, value, icon: Icon }) => {
          const isActive = selection === value;
          return (
            <button
              key={value}
              type="button"
              onClick={() => handleSelect(value)}
              aria-pressed={isActive}
              className={cn(
                "relative flex min-w-24 flex-1 items-center justify-center gap-2 rounded-full px-3 py-1.5 text-[11px] tracking-[0.08em] transition-all",
                isActive
                  ? "bg-linear-to-r from-primary to-primary/80 text-primary-foreground shadow-md"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className="h-4 w-4" aria-hidden />
              <span>{itemLabel}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function ThemeSelectorSkeleton({
  className,
  variant = "inline",
}: {
  className?: string;
  variant?: keyof typeof variantStyles;
}) {
  return (
    <div
      className={cn(
        "h-11 animate-pulse rounded-full border border-border/40 bg-muted/60",
        variantStyles[variant],
        className
      )}
      aria-hidden
    />
  );
}
