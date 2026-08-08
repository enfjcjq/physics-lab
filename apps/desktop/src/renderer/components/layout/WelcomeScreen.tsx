import { useState, useEffect } from "react";
import { useI18n } from "../../core/i18n";
import { useSimulation } from "../../features/experiment/experiment.store";

export function WelcomeScreen() {
  const { t } = useI18n();
  const play = useSimulation((s) => s.play);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const seen = localStorage.getItem("physics-lab:welcome-seen");
    if (!seen) setVisible(true);
  }, []);

  const dismiss = () => {
    localStorage.setItem("physics-lab:welcome-seen", "1");
    setVisible(false);
    setTimeout(() => play(), 300);
  };

  if (!visible) return null;

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-950/90 backdrop-blur-md">
      <div className="max-w-lg w-full mx-4 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-8 text-center">
        {/* Logo */}
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-sky-600 to-violet-600 flex items-center justify-center text-2xl shadow-lg shadow-sky-900/40">
          \u269B\uFE0F
        </div>

        <h1 className="text-2xl font-bold text-white mb-2">Physics Lab</h1>
        <p className="text-sm text-slate-400 mb-6">{t("welcome.subtitle")}</p>

        {/* Steps */}
        <div className="space-y-4 mb-6">
          <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50 text-left">
            <div className="flex items-center gap-3 mb-2">
              <span className="w-8 h-8 rounded-lg bg-sky-600/20 flex items-center justify-center text-sky-400 text-sm font-bold">1</span>
              <span className="text-sm font-medium text-white">{t("welcome.step1")}</span>
            </div>
            <p className="text-xs text-slate-400 ml-11">{t("welcome.step1_desc")}</p>
          </div>
          <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50 text-left">
            <div className="flex items-center gap-3 mb-2">
              <span className="w-8 h-8 rounded-lg bg-emerald-600/20 flex items-center justify-center text-emerald-400 text-sm font-bold">2</span>
              <span className="text-sm font-medium text-white">{t("welcome.step2")}</span>
            </div>
            <p className="text-xs text-slate-400 ml-11">{t("welcome.step2_desc")}</p>
          </div>
          <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50 text-left">
            <div className="flex items-center gap-3 mb-2">
              <span className="w-8 h-8 rounded-lg bg-violet-600/20 flex items-center justify-center text-violet-400 text-sm font-bold">3</span>
              <span className="text-sm font-medium text-white">{t("welcome.step3")}</span>
            </div>
            <p className="text-xs text-slate-400 ml-11">{t("welcome.step3_desc")}</p>
          </div>
        </div>

        {/* Get started (P2: no mode division) */}
        <button onClick={dismiss} className="w-full py-3 px-4 rounded-xl bg-gradient-to-br from-sky-600 to-sky-700 hover:from-sky-500 hover:to-sky-600 text-white text-sm font-medium shadow-lg shadow-sky-900/30">
          {t("welcome.start")}
        </button>
        <button onClick={dismiss} className="text-xs text-slate-600 hover:text-slate-400">
          {t("welcome.skip")}
        </button>
      </div>
    </div>
  );
}
