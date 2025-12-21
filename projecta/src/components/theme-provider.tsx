"use client";

import * as React from "react";
import { ThemeProvider as NextThemesProvider, useTheme } from "next-themes";
type ThemeProviderProps = React.ComponentProps<typeof NextThemesProvider>;

import { useThemeStore } from "@/lib/stores/theme";
import type { ThemeMode } from "@/lib/stores/theme";

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="light"
      enableSystem
      disableTransitionOnChange
      {...props}
    >
      <ThemeBridge />
      {children}
    </NextThemesProvider>
  );
}

function ThemeBridge() {
  const { theme, resolvedTheme } = useTheme();
  const setMode = useThemeStore((state) => state.setMode);
  const setReady = useThemeStore((state) => state.setReady);

  React.useEffect(() => {
    const current = (theme ?? resolvedTheme ?? "system") as ThemeMode;
    setMode(current);
    setReady(true);
  }, [theme, resolvedTheme, setMode, setReady]);

  return null;
}
