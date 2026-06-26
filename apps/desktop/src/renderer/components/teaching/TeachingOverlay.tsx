import { useSimulation } from "../../features/experiment/experiment.store";
import { useTeaching } from "../../core/teaching.store";
import { useI18n } from "../../core/i18n";
import type { TeacherStep } from "@physics-lab/shared";

export function TeachingOverlay() {
  const currentTime = useSimulation((s) => s.currentTime);
  const currentPhaseId = useSimulation((s) => s.currentPhaseId);
  const phases = useSimulation((s) => s.phases);
  const scene = useSimulation((s) => s.scene);
  const { mode, subMode, overlay: ov, setSubMode } = useTeaching();
  const { t } = useI18n();

  if (mode === "experiment") return null;

  // Derive overlay steps from scene teacher_steps (data-driven!)
  const steps: TeacherStep[] = scene?.teacher_steps ?? [];
  const sortedSteps = [...steps].sort((a, b) => a.order - b.order);

  if (sortedSteps.length === 0) return null;

  // Find current step based on time
  const currentIdx = (() => {
    for (let i = sortedSteps.length - 1; i >= 0; i--) {
      if (currentTime >= sortedSteps[i].timeStart) return i;
    }
    return 0;
  })();
  const step = sortedSteps[currentIdx];
  const nextStep = currentIdx < sortedSteps.length - 1 ? sortedSteps[currentIdx + 1] : null;

  // Get current phase for contextual display
  const currentPhase = phases.find((p) => p.id === currentPhaseId);

  return (
    <div className="absolute left-4 bottom-20 z-20 max-w-sm transition-all duration-500"
         style={{ opacity: 1, transform: "translateY(0)" }}>
      <div className="bg-slate-900/90 backdrop-blur border border-sky-800/40 rounded-xl p-4 shadow-2xl transition-all duration-300">
        {/* Sub-mode selector */}
        <div className="flex gap-1 mb-3">
          {(["experiment", "teaching", "solving", "explore"] as const).map((m) => (
            <button
              key={m}
              onClick={() => setSubMode(m)}
              className={`px-2 py-1 rounded text-[10px] font-medium transition-colors ${
                subMode === m ? "bg-sky-600 text-white" : "bg-slate-800 text-slate-500 hover:text-slate-300"
              }`}
            >
              {t("teaching.mode." + m)}
            </button>
          ))}
        </div>

        {/* Step progress */}
        <div className="flex gap-1 mb-3">
          {sortedSteps.map((_, i) => (
            <div key={i} className={`flex-1 h-1 rounded-full transition-colors duration-300 ${i <= currentIdx ? "bg-sky-500" : "bg-slate-700"}`} />
          ))}
        </div>

        {/* Step indicator */}
        <div className="mb-1">
          <span className="text-[10px] text-sky-400 uppercase tracking-wider">
            {t("overlay.step")} {currentIdx + 1}/{sortedSteps.length}
          </span>
          {currentPhase && (
            <span className="ml-2 text-[10px] text-slate-500">| {t(currentPhase.label)}</span>
          )}
        </div>

        {/* Current step title & description */}
        <h3 className="text-sm font-semibold text-white mb-1">{t(step.titleKey)}</h3>
        <p className="text-xs text-slate-300 leading-relaxed mb-2">{t(step.descKey)}</p>

        {/* Formula (conditionally shown) */}
        {step.formulaKey && ov.showFormulas && (
          <div className="px-2 py-1.5 bg-slate-800 rounded-lg text-xs font-mono text-sky-300 animate-in fade-in">
            {t(step.formulaKey)}
          </div>
        )}

        {/* Phase description */}
        {currentPhase?.description && (
          <div className="mt-2 pt-2 border-t border-slate-800">
            <div className="text-[10px] text-slate-500 mb-0.5">{t("overlay.phase_info")}</div>
            <div className="text-xs text-slate-400">{currentPhase.description}</div>
          </div>
        )}

        {/* Next step hint (explore mode) */}
        {subMode === "explore" && nextStep && (
          <div className="mt-2 pt-2 border-t border-slate-800">
            <div className="text-[10px] text-slate-600">{t("overlay.next")}:</div>
            <div className="text-xs text-slate-500 mt-0.5">{t(nextStep.titleKey)}</div>
          </div>
        )}

        {/* Phase transition indicator */}
        {nextStep && nextStep.timeStart - currentTime < 0.3 && nextStep.timeStart > currentTime && (
          <div className="mt-2 pt-2 border-t border-slate-800 animate-pulse">
            <div className="text-[10px] text-amber-400">{t("overlay.upcoming")}: {t(nextStep.titleKey)}</div>
          </div>
        )}
      </div>
    </div>
  );
}
