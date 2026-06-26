import { useSimulation } from "../../features/experiment/experiment.store";
import { useTeaching } from "../../core/teaching.store";
import { useI18n } from "../../core/i18n";

interface TeachingStep {
  time: number;
  titleKey: string;
  contentKey: string;
  formulaKey?: string;
}

const STEPS: TeachingStep[] = [
  { time: 0.0, titleKey: "overlay.step.release",       contentKey: "overlay.step.content.release",       formulaKey: "overlay.step.formula.release" },
  { time: 0.3, titleKey: "overlay.step.gravity",       contentKey: "overlay.step.content.gravity",       formulaKey: "overlay.step.formula.gravity" },
  { time: 0.6, titleKey: "overlay.step.accelerating",  contentKey: "overlay.step.content.accelerating",  formulaKey: "overlay.step.formula.accelerating" },
  { time: 1.0, titleKey: "overlay.step.midpoint",      contentKey: "overlay.step.content.midpoint",      formulaKey: "overlay.step.formula.midpoint" },
  { time: 1.4, titleKey: "overlay.step.impact",        contentKey: "overlay.step.content.impact",        formulaKey: "overlay.step.formula.impact" },
  { time: 1.5, titleKey: "overlay.step.rebound",       contentKey: "overlay.step.content.rebound",       formulaKey: "overlay.step.formula.rebound" },
  { time: 2.5, titleKey: "overlay.step.second_fall",   contentKey: "overlay.step.content.second_fall",   formulaKey: "overlay.step.formula.second_fall" },
];

export function TeachingOverlay() {
  const currentTime = useSimulation((s) => s.currentTime);
  const { mode, subMode, overlay: ov, setSubMode } = useTeaching();
  const { t } = useI18n();

  if (mode === "experiment") return null;

  const currentStep = [...STEPS].reverse().find((s) => currentTime >= s.time) ?? STEPS[0];
  const nextStep = STEPS.find((s) => s.time > currentTime);
  const stepIndex = STEPS.indexOf(currentStep);

  return (
    <div className="absolute left-4 bottom-20 z-20 max-w-sm">
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
          {STEPS.map((_, i) => (
            <div key={i} className={`flex-1 h-1 rounded-full transition-colors ${i <= stepIndex ? "bg-sky-500" : "bg-slate-700"}`} />
          ))}
        </div>

        {/* Current step */}
        <div className="mb-1">
          <span className="text-[10px] text-sky-400 uppercase tracking-wider">
            {t("overlay.step")} {stepIndex + 1}/{STEPS.length}
          </span>
        </div>
        <h3 className="text-sm font-semibold text-white mb-1">{t(currentStep.titleKey)}</h3>
        <p className="text-xs text-slate-300 leading-relaxed mb-2">{t(currentStep.contentKey)}</p>
        {currentStep.formulaKey && ov.showFormulas && (
          <div className="px-2 py-1.5 bg-slate-800 rounded-lg text-xs font-mono text-sky-300">
            {t(currentStep.formulaKey)}
          </div>
        )}

        {/* Next step hint */}
        {subMode === "explore" && nextStep && (
          <div className="mt-2 pt-2 border-t border-slate-800">
            <div className="text-[10px] text-slate-600">{t("overlay.next")}:</div>
            <div className="text-xs text-slate-500 mt-0.5">{t(nextStep.titleKey)}</div>
          </div>
        )}
      </div>
    </div>
  );
}
