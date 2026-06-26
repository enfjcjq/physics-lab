export type ThemeMode = "dark" | "light" | "auto";
interface ThemeState {
    mode: ThemeMode;
    setMode: (mode: ThemeMode) => void;
    /** Resolved theme: "dark" or "light" (auto resolves based on system) */
    resolved: () => "dark" | "light";
}
export declare const useTheme: import("zustand").UseBoundStore<import("zustand").StoreApi<ThemeState>>;
export {};
//# sourceMappingURL=theme.store.d.ts.map