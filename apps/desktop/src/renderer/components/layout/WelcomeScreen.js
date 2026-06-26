import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from "react";
import { useI18n } from "../../core/i18n";
import { useTeaching } from "../../core/teaching.store";
export function WelcomeScreen() {
    const { t } = useI18n();
    const { setMode } = useTeaching();
    const [visible, setVisible] = useState(false);
    const [step, setStep] = useState(0);
    useEffect(() => {
        const seen = localStorage.getItem("physics-lab:welcome-seen");
        if (!seen)
            setVisible(true);
    }, []);
    const dismiss = () => {
        localStorage.setItem("physics-lab:welcome-seen", "1");
        setVisible(false);
        setMode("learning");
    };
    const startInMode = (mode) => {
        localStorage.setItem("physics-lab:welcome-seen", "1");
        setVisible(false);
        setMode(mode);
    };
    if (!visible)
        return null;
    return (_jsx("div", { className: "absolute inset-0 z-50 flex items-center justify-center bg-slate-950/90 backdrop-blur-md", children: _jsxs("div", { className: "max-w-lg w-full mx-4 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-8 text-center", children: [_jsx("div", { className: "w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-sky-600 to-violet-600 flex items-center justify-center text-2xl shadow-lg shadow-sky-900/40", children: "\u269B" }), _jsx("h1", { className: "text-2xl font-bold text-white mb-2", children: "Physics Lab" }), _jsx("p", { className: "text-sm text-slate-400 mb-6", children: t("welcome.subtitle") }), step === 0 && (_jsxs("div", { className: "space-y-4 mb-6", children: [_jsxs("div", { className: "bg-slate-800/50 rounded-xl p-4 border border-slate-700/50 text-left", children: [_jsxs("div", { className: "flex items-center gap-3 mb-2", children: [_jsx("span", { className: "w-8 h-8 rounded-lg bg-sky-600/20 flex items-center justify-center text-sky-400", children: "1" }), _jsx("span", { className: "text-sm font-medium text-white", children: t("welcome.step1") })] }), _jsx("p", { className: "text-xs text-slate-400 ml-11", children: t("welcome.step1_desc") })] }), _jsxs("div", { className: "bg-slate-800/50 rounded-xl p-4 border border-slate-700/50 text-left", children: [_jsxs("div", { className: "flex items-center gap-3 mb-2", children: [_jsx("span", { className: "w-8 h-8 rounded-lg bg-emerald-600/20 flex items-center justify-center text-emerald-400", children: "2" }), _jsx("span", { className: "text-sm font-medium text-white", children: t("welcome.step2") })] }), _jsx("p", { className: "text-xs text-slate-400 ml-11", children: t("welcome.step2_desc") })] }), _jsxs("div", { className: "bg-slate-800/50 rounded-xl p-4 border border-slate-700/50 text-left", children: [_jsxs("div", { className: "flex items-center gap-3 mb-2", children: [_jsx("span", { className: "w-8 h-8 rounded-lg bg-violet-600/20 flex items-center justify-center text-violet-400", children: "3" }), _jsx("span", { className: "text-sm font-medium text-white", children: t("welcome.step3") })] }), _jsx("p", { className: "text-xs text-slate-400 ml-11", children: t("welcome.step3_desc") })] })] })), _jsxs("div", { className: "flex gap-3 justify-center mb-4", children: [_jsxs("button", { onClick: () => startInMode("learning"), className: "flex-1 py-3 px-4 rounded-xl bg-gradient-to-br from-sky-600 to-sky-700 hover:from-sky-500 hover:to-sky-600 text-white text-sm font-medium shadow-lg shadow-sky-900/30", children: ["\uD83C\uDF93 ", t("mode.learning")] }), _jsxs("button", { onClick: () => startInMode("experiment"), className: "flex-1 py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium border border-slate-700", children: ["\uD83D\uDD2C ", t("mode.experiment")] })] }), _jsx("button", { onClick: dismiss, className: "text-xs text-slate-600 hover:text-slate-400", children: t("welcome.skip") })] }) }));
}
//# sourceMappingURL=WelcomeScreen.js.map