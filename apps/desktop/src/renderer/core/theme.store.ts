import { create } from "zustand";

export type ThemeMode = "dark" | "light" | "auto";

interface ThemeState {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  /** Resolved theme: "dark" or "light" (auto resolves based on system) */
  resolved: () => "dark" | "light";
}

function getSystemTheme(): "dark" | "light" {
  if (typeof window === "undefined") return "dark";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export const useTheme = create<ThemeState>((set, get) => ({
  mode: "dark",
  setMode: (mode) => {
    set({ mode });
    applyTheme(mode);
    if (mode === "auto") {
      localStorage.removeItem("theme");
    } else {
      localStorage.setItem("theme", mode);
    }
  },
  resolved: () => {
    const mode = get().mode;
    return mode === "auto" ? getSystemTheme() : mode;
  },
}));

function applyTheme(mode: ThemeMode): void {
  const resolved = mode === "auto" ? getSystemTheme() : mode;
  document.documentElement.setAttribute("data-theme", resolved);
}

// Listen for system theme changes in auto mode
if (typeof window !== "undefined") {
  window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => {
    const state = useTheme.getState();
    if (state.mode === "auto") {
      applyTheme("auto");
    }
  });
}

// Initialize from localStorage
const saved = typeof localStorage !== "undefined" ? localStorage.getItem("theme") : null;
if (saved === "dark" || saved === "light" || saved === "auto") {
  useTheme.getState().setMode(saved as ThemeMode);
} else {
  useTheme.getState().setMode("dark");
}
