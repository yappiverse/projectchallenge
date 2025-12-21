"use client";

import { create } from "zustand";

export type ThemeMode = "light" | "dark" | "system";

interface ThemeState {
    mode: ThemeMode;
    ready: boolean;
    setMode: (mode: ThemeMode) => void;
    setReady: (ready: boolean) => void;
}

export const useThemeStore = create<ThemeState>((set) => ({
    mode: "system",
    ready: false,
    setMode: (mode) => set({ mode }),
    setReady: (ready) => set({ ready }),
}));
