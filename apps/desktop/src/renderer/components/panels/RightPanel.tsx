import { useState } from "react";
import { usePanelManager } from "../../core/panel-manager.store";
import { useSimulation } from "../../features/experiment/experiment.store";
import { useI18n } from "../../core/i18n";
import { CollapseHandle } from "../layout/CollapseHandle";
import { KnowledgeGraph } from "../teaching/KnowledgeGraph";

type AnalysisTab = "force" | "motion" | "formula" | "knowledge" | "tips" | "graph";

export function RightPanel() {
  const rightOpen = usePanelManager((s) => s.panels.analysis?.isOpen ?? true);
  const toggleRight = () => usePanelManager.getState().toggle("analysis");
  const scene = useSimulation((s) => s.scene);
  const { t } = useI18n();
  const [activeTab, setActiveTab] = useState<AnalysisTab>("force");

  const TABS: { id: AnalysisTab; labelKey: string }[] = [
    { id: "force", labelKey: "analysis.force" },
    { id: "motion", labelKey: "analysis.motion" },
    { id: "formula", labelKey: "analysis.formula" },
    { id: "knowledge", labelKey: "analysis.knowledge" },
    { id: "tips", labelKey: "analysis.tips" },
    { id: "graph", labelKey: "analysis.graph" },
  ];

  const forces = scene?.forces ?? [];
  const equations = scene?.equations ?? [];
  const knowledgeTags = scene?.knowledge_tags ?? [];

  return (
    <div className={`relative flex-shrink-0 transition-all duration-300 ease-in-out overflow-hidden ${rightOpen ? "w-[340px]" : "w-0"}`}>
      <div className="w-[340px] h-full bg-slate-900/95 border-l border-slate-800 flex flex-col">
        <CollapseHandle side="right" open={rightOpen} onToggle={toggleRight} />
        <div className="px-4 pt-4 pb-2">
          <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{t("panel.analysis")}</h2>
        </div>
        <div className="px-2 pb-3">
          <div className="flex flex-wrap gap-1">
            {TABS.map((tab) => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`px-2.5 py-1.5 text-xs rounded-md transition-all whitespace-nowrap ${
                  activeTab === tab.id ? "bg-sky-600/20 text-sky-400 border border-sky-600/30" : "text-slate-500 hover:text-slate-300 hover:bg-slate-800/50"
                }`}>
                {t(tab.labelKey)}
              </button>
            ))}
          </div>
        </div>
        <div className="border-t border-slate-800" />
        <div className="flex-1 overflow-y-auto px-4 py-3">
          {activeTab === "force" && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-slate-200">{t("analysis.force_title")}</h3>
              {forces.map((f, i) => (
                <div key={i} className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/50">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm font-medium text-white">{f.description || f.type}</span>
                    <span className={`text-xs px-1.5 py-0.5 rounded ${f.is_constant ? "bg-sky-900/40 text-sky-400" : "bg-amber-900/40 text-amber-400"}`}>
                      {f.is_constant ? t("analysis.constant") : t("analysis.variable")}
                    </span>
                  </div>
                  <div className="text-xs text-slate-400 space-y-1">
                    <div>{t("analysis.direction")}: [{String(f.direction)}]</div>
                    <div className="font-mono text-sky-300">{String(f.magnitude)}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
          {activeTab === "motion" && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-slate-200">{t("analysis.motion_title")}</h3>
              {equations.filter(e => e.type === "motion").map((eq, i) => (
                <div key={i} className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/50">
                  <div className="text-sm font-medium text-white mb-1">{eq.name}</div>
                  <div className="px-2 py-1.5 bg-slate-900 rounded text-xs font-mono text-sky-300">{eq.expression}</div>
                  {Object.entries(eq.variables).map(([k, v]) => (
                    <div key={k} className="text-xs text-slate-500 mt-1">{v.symbol}: {v.description} ({v.unit})</div>
                  ))}
                </div>
              ))}
            </div>
          )}
          {activeTab === "formula" && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-slate-200">{t("analysis.formula_title")}</h3>
              {equations.map((eq, i) => (
                <div key={i} className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/50">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-5 h-5 rounded-full bg-sky-900/50 border border-sky-700/50 flex items-center justify-center text-[10px] text-sky-400">{i + 1}</span>
                    <span className="text-sm font-medium text-white">{eq.name}</span>
                    {eq.is_solution && <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-900/40 text-emerald-400">{t("analysis.solution")}</span>}
                  </div>
                  <div className="px-2 py-1.5 bg-slate-900 rounded text-xs font-mono text-sky-300">{eq.expression}</div>
                  {eq.derivation && eq.derivation.map((d, j) => (
                    <div key={j} className="text-xs text-slate-500 mt-1">{d}</div>
                  ))}
                </div>
              ))}
            </div>
          )}
          {activeTab === "knowledge" && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-slate-200">{t("analysis.knowledge_title")}</h3>
              <div className="flex flex-wrap gap-2">
                {knowledgeTags.map((kp) => (
                  <div key={kp.id} className="px-3 py-1.5 rounded-full text-xs font-medium border bg-slate-800/50 border-slate-700/50 text-slate-400">
                    {kp.name}
                    <span className="ml-1 text-[10px] opacity-60">{kp.category}</span>
                  </div>
                ))}
              </div>
              {knowledgeTags.some(k => k.common_mistakes) && (
                <div className="mt-3">
                  <h4 className="text-[10px] text-amber-400 uppercase tracking-wider mb-2">{t("analysis.mistakes")}</h4>
                  {knowledgeTags.filter(k => k.common_mistakes).map((k, i) => (
                    k.common_mistakes?.map((m, j) => (
                      <div key={`${i}-${j}`} className="flex items-start gap-2 bg-amber-900/10 border border-amber-800/20 rounded-lg p-2 mb-1">
                        <span className="text-amber-500 text-xs">!</span>
                        <span className="text-xs text-slate-300">{m}</span>
                      </div>
                    ))
                  ))}
                </div>
              )}
            </div>
          )}
          {activeTab === "graph" && <KnowledgeGraph />}
          {activeTab === "tips" && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-slate-200">{t("analysis.tips_title")}</h3>
              {knowledgeTags.filter(k => k.learning_tips).map((k, i) => (
                <div key={i} className="flex items-start gap-2 bg-emerald-900/10 border border-emerald-800/20 rounded-lg p-2.5">
                  <span className="text-emerald-500 text-xs">&gt;</span>
                  <div>
                    <span className="text-xs text-slate-300">{k.learning_tips}</span>
                    <div className="text-[10px] text-slate-600 mt-0.5">{k.name}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
