"use client";

import { Monitor, MoonStar, SunMedium } from "lucide-react";
import { useTheme } from "next-themes";

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

  const selection = theme ?? "system";

  return (
    <div
      className={cn(
        "rounded-full border border-border bg-muted/60 px-1 py-1 text-xs text-muted-foreground shadow-sm backdrop-blur-sm",
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
                "flex min-w-[88px] flex-1 items-center justify-center gap-2 rounded-full px-3 py-1.5 font-semibold transition",
                isActive
                  ? "bg-background text-foreground shadow-sm"
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
