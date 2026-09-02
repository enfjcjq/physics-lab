import { useSimulation } from "../../features/experiment/experiment.store";
import { useState } from "react";
import { Scene3D } from "../../features/experiment/components/Scene3D";
import { Scene2D } from "../../features/experiment/components/scene2d/Scene2D";
import { TeachingOverlay } from "../teaching/TeachingOverlay";
import { TeachingLayer } from "../../features/experiment/components/teaching/TeachingLayer";
import { beautifyFormula } from "../../features/experiment/components/teaching/formula-beautify";
import { useI18n } from "../../core/i18n";
import { useVisualization } from "../../core/visualization.store";
import { pluginRegistry } from "../../core/plugin-registry";
import { useTeaching } from "../../core/teaching.store";

// HTML formula overlay (replaces broken 3D Text)
function FormulaHTML() {
  const currentTime = useSimulation((s) => s.currentTime);
  const scene = useSimulation((s) => s.scene);
  const show = useVisualization((s) => s.toggles.showFormulas);
  const { t } = useI18n();

  if (!show || !scene?.teacher_steps) return null;

  const steps = [...scene.teacher_steps].sort((a, b) => a.order - b.order);
  let bestStep: typeof steps[0] | null = null;
  for (const s of steps) {
    if (s.timeStart <= currentTime && s.formulaKey) { bestStep = s; }
  }
  if (!bestStep) {
    for (const s of steps) {
      if (s.formulaKey) { bestStep = s; break; }
    }
  }
  if (!bestStep?.formulaKey) return null;

  const formula = t(bestStep.formulaKey);
  const lines = formula.split("\n").filter(l => l.trim());

  return (
    <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
      <div className="bg-slate-900/85 backdrop-blur border border-amber-500/30 rounded-xl px-5 py-3 shadow-2xl shadow-amber-900/20">
        {lines.map((line: string, i: number) => (
          <div key={i} className="text-sm font-mono text-amber-300 text-center whitespace-nowrap leading-relaxed">
{beautifyFormula(line.trim())}
          </div>
        ))}
      </div>
    </div>
  );
}

export function CenterPanel() {
  const [libOpen, setLibOpen] = useState(false);
  const [view2D, setView2D] = useState(false);
  const pluginLoading = useSimulation((s) => s.pluginLoading);
  const activePluginId = useSimulation((s) => s.activePluginId);
  const setActivePlugin = useSimulation((s) => s.setActivePlugin);
  const currentPhaseId = useSimulation((s) => s.currentPhaseId);
  const phases = useSimulation((s) => s.phases);
  const jumpToPhase = useSimulation((s) => s.jumpToPhase);
  const { t } = useI18n();
  const teachingLayerEnabled = useTeaching((s) => s.teachingLayerEnabled);
  const showLegacyOverlay = useTeaching((s) => s.showLegacyOverlay);
  const showFormulaStrip = useTeaching((s) => s.showFormulaStrip);

  const currentPhase = phases.find((p) => p.id === currentPhaseId);

  const expIcons: Record<string, string> = {
    "free-fall": "\u2B07", 
    "projectile-motion": "\u2197",
    "inclined-plane": "\u2220", 
    "collision": "\u25CF\u25CB",
    "spring-mass": "\u223C", 
    "pendulum": "\u231A"
  };

  return (
    <div className="flex-1 relative min-w-0">
      {/* Experiment library drawer (P2 first step: switcher moved here) */}
      <div className="absolute top-3 left-4 z-20">
        <div className="relative">
          <button
            onClick={() => setLibOpen(!libOpen)}
            className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 flex items-center gap-1 bg-slate-900/90 backdrop-blur-md border border-slate-600/50 shadow-xl text-slate-200 hover:bg-slate-800/80"
          >
            <span className="text-xs">{"\u269B\uFE0F"}</span>
            <span className="inline">{t("rail.library")}</span>
            <span className="text-[9px] text-slate-500">{libOpen ? "\u25B2" : "\u25BC"}</span>
          </button>
          {libOpen && (
            <>
              <div className="fixed inset-0 z-30" onClick={() => setLibOpen(false)} />
              <div className="absolute top-full left-0 mt-1 z-40 w-56 max-h-[60vh] overflow-y-auto bg-slate-900/95 backdrop-blur-md border border-slate-700 rounded-xl shadow-2xl py-1">
                {pluginRegistry.list().map((p) => (
                  <button
                    key={p.id}
                    onClick={async () => { if (p.id !== activePluginId) await setActivePlugin(p.id); setLibOpen(false); }}
                    className={"w-full text-left px-3 py-2 text-xs transition-colors flex items-center gap-2 " +
                      (p.id === activePluginId ? "bg-sky-600/20 text-sky-300" : "text-slate-300 hover:bg-slate-800/60 hover:text-white")}
                  >
                    <span className="text-xs">{expIcons[p.id] || "⚡"}</span>
                    <span className="inline">{t(p.name)}</span>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
      {/* 2D/3D view toggle (S88-A vertical slice preview) */}
      <div className="absolute top-3 right-4 z-20">
        <button
          onClick={() => setView2D(!view2D)}
          className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 bg-slate-900/90 backdrop-blur-md border border-slate-600/50 shadow-xl text-slate-200 hover:bg-slate-800/80"
        >
          {view2D ? t("view.switch_3d") : t("view.switch_2d")}
        </button>
      </div>
      {pluginLoading && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-4">
            {/* Skeleton 3D viewport */}
            <div className="w-64 h-40 bg-slate-800/80 rounded-xl animate-pulse border border-slate-700/30 flex items-center justify-center">
              <div className="w-16 h-16 rounded-full bg-slate-700/50" />
            </div>
            {/* Skeleton progress bar */}
            <div className="w-48 h-2 bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-sky-600 to-violet-600 rounded-full animate-pulse" style={{width: "60%"}} />
            </div>
            <span className="text-xs text-slate-500">{t("ui.loading")}</span>
          </div>
        </div>
      )}
      {view2D ? <Scene2D /> : <Scene3D />}
      {!view2D && <TeachingLayer />}
      {!view2D && showLegacyOverlay && <TeachingOverlay />}
      {!view2D && !(teachingLayerEnabled && showFormulaStrip) && <FormulaHTML />}
      {/* Phase indicator */}
      <div className="absolute bottom-4 left-4 z-10">
        <div className="bg-slate-900/80 backdrop-blur border border-slate-700/50 rounded-lg px-3 py-1.5 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-sky-400"/>
          <span className="text-xs text-slate-300">
            {currentPhase ? t(currentPhase.label) : currentPhaseId}
          </span>
        </div>
      </div>
      {/* Phase quick-jump */}
      <div className="absolute top-3 left-1/2 -translate-x-1/2 z-10">
        <div className="flex items-center gap-0 bg-slate-900/80 backdrop-blur border border-slate-700/50 rounded-full px-1 py-1 shadow-lg">
          {phases.map((p, i) => (
            <div key={p.id} className="flex items-center">
              <button
                onClick={() => jumpToPhase(p.id)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all duration-200 ${
                  currentPhaseId === p.id
                    ? "bg-sky-600 text-white shadow-md shadow-sky-900/30 scale-105"
                    : "text-slate-500 hover:text-slate-300 hover:bg-slate-800/50"
                }`}
                title={p.description || t(p.label)}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${currentPhaseId===p.id ? "bg-white" : "bg-slate-600"}`} />
                <span className="inline">{t(p.label)}</span>
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


