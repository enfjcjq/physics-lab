import { create } from "zustand";
import enUS from "../locales/en-US.json";
import zhCN from "../locales/zh-CN.json";

export type Locale = "en-US" | "zh-CN";

const locales: Record<Locale, Record<string, string>> = {
  "en-US": enUS,
  "zh-CN": zhCN,
};

interface I18nState {
  locale: Locale;
  t: (key: string, fallback?: string) => string;
  setLocale: (locale: Locale) => void;
}

export const useI18n = create<I18nState>((set, get) => ({
  locale: "zh-CN",
  t: (key, fallback) => {
    const dict = locales[get().locale];
    return dict[key] ?? fallback ?? key;
  },
  setLocale: (locale) => set({ locale }),
}));

/** Non-hook access for places where hooks can't be used */
export function t(key: string, fallback?: string): string {
  const dict = locales[useI18n.getState().locale];
  return dict[key] ?? fallback ?? key;
}
