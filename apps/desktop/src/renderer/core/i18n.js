import { create } from "zustand";
import enUS from "../locales/en-US.json";
import zhCN from "../locales/zh-CN.json";
const locales = {
    "en-US": enUS,
    "zh-CN": zhCN,
};
export const useI18n = create((set, get) => ({
    locale: "zh-CN",
    t: (key, fallback) => {
        const dict = locales[get().locale];
        return dict[key] ?? fallback ?? key;
    },
    setLocale: (locale) => set({ locale }),
}));
/** Non-hook access for places where hooks can't be used */
export function t(key, fallback) {
    const dict = locales[useI18n.getState().locale];
    return dict[key] ?? fallback ?? key;
}
//# sourceMappingURL=i18n.js.map