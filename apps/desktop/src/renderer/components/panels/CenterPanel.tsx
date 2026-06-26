import { useSimulation } from "../../features/experiment/experiment.store";
import { Scene3D } from "../../features/experiment/components/Scene3D";
import { TeachingOverlay } from "../teaching/TeachingOverlay";
import { useI18n } from "../../core/i18n";

export function CenterPanel() {
  const pluginLoading = useSimulation((s) => s.pluginLoading);
  const currentPhaseId = useSimulation((s) => s.currentPhaseId);
  const phases = useSimulation((s) => s.phases);
  const jumpToPhase = useSimulation((s) => s.jumpToPhase);
  const { t } = useI18n();

  const currentPhase = phases.find((p) => p.id === currentPhaseId);

  return (
    <div className="flex-1 relative min-w-0">
      {pluginLoading && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-xs text-slate-400">{t("ui.loading")}</span>
          </div>
        </div>
      )}
      <Scene3D />
      <TeachingOverlay />
      {/* Phase indicator */}
      <div className="absolute bottom-4 left-4 z-10">
        <div className="bg-slate-900/80 backdrop-blur border border-slate-700/50 rounded-lg px-3 py-1.5 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-sky-400"/>
          <span className="text-xs text-slate-300">
            {currentPhase ? t(currentPhase.label) : currentPhaseId}
          </span>
        </div>
      </div>
      {/* Phase quick-jump - timeline-style */}
      <div className="absolute top-3 left-1/2 -translate-x-1/2 z-10">
        <div className="flex items-center gap-0 bg-slate-900/80 backdrop-blur border border-slate-700/50 rounded-full px-1 py-1 shadow-lg">
          {phases.map((p, i) => (
            <div key={p.id} className="flex items-center">
              <button
                onClick={() => jumpToPhase(p.id)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-medium transition-all duration-300 ${
                  currentPhaseId === p.id
                    ? "bg-sky-600 text-white shadow-md shadow-sky-900/30 scale-105"
                    : "text-slate-500 hover:text-slate-300 hover:bg-slate-800/50"
                }`}
                title={p.description || t(p.label)}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${currentPhaseId===p.id ? "bg-white" : "bg-slate-600"}`} />
                <span className="hidden sm:inline">{t(p.label)}</span>
              </button>
              {i < phases.length - 1 && (
                <div className="w-3 h-px bg-slate-700" />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
