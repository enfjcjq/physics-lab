export type Locale = "en-US" | "zh-CN";
interface I18nState {
    locale: Locale;
    t: (key: string, fallback?: string) => string;
    setLocale: (locale: Locale) => void;
}
export declare const useI18n: import("zustand").UseBoundStore<import("zustand").StoreApi<I18nState>>;
/** Non-hook access for places where hooks can't be used */
export declare function t(key: string, fallback?: string): string;
export {};
//# sourceMappingURL=i18n.d.ts.map