import { usePanelManager } from "../../core/panel-manager.store";
import { useUIStore } from "../../stores/ui.store";
import type { AnalysisTab } from "../../stores/ui.store";
import { useAnalysisStore } from "../../stores/analysis.store";
import { CollapseHandle } from "../layout/CollapseHandle";

const ANALYSIS_TABS: { id: AnalysisTab; label: string }[] = [
  { id: "force", label: "Forces" },
  { id: "motion", label: "Motion" },
  { id: "derivation", label: "Derivation" },
  { id: "knowledge", label: "Topics" },
  { id: "tips", label: "Tips" },
];

export function RightPanel() {
  const rightOpen = usePanelManager((s) => s.panels.analysis?.isOpen ?? true);
  const toggleRight = () => usePanelManager.getState().toggle("analysis");
  const activeTab = useUIStore((s) => s.activeAnalysisTab);
  const setTab = useUIStore((s) => s.setAnalysisTab);
  const analysis = useAnalysisStore();

  return (
    <div className={`relative flex-shrink-0 transition-all duration-300 ease-in-out overflow-hidden
      ${rightOpen ? "w-[340px]" : "w-0"}`}>
      <div className="w-[340px] h-full bg-slate-900/95 border-l border-slate-800 flex flex-col">
        <CollapseHandle side="right" open={rightOpen} onToggle={toggleRight} />
        <div className="px-4 pt-4 pb-2">
          <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">AI Analysis</h2>
        </div>
        <div className="px-2 pb-3">
          <div className="flex flex-wrap gap-1">
            {ANALYSIS_TABS.map((tab) => (
              <button key={tab.id} onClick={() => setTab(tab.id)}
                className={`px-2.5 py-1.5 text-xs rounded-md transition-all whitespace-nowrap ${
                  activeTab === tab.id
                    ? "bg-sky-600/20 text-sky-400 border border-sky-600/30"
                    : "text-slate-500 hover:text-slate-300 hover:bg-slate-800/50"
                }`}>
                {tab.label}
              </button>
            ))}
          </div>
        </div>
        <div className="border-t border-slate-800" />
        <div className="flex-1 overflow-y-auto px-4 py-3">
          {activeTab === "force" && <ForceTab a={analysis} />}
          {activeTab === "motion" && <MotionTab a={analysis} />}
          {activeTab === "derivation" && <DerivationTab a={analysis} />}
          {activeTab === "knowledge" && <KnowledgeTab a={analysis} />}
          {activeTab === "tips" && <TipsTab a={analysis} />}
        </div>
        <div className="border-t border-slate-800 px-4 py-3">
          <div className="bg-gradient-to-r from-sky-900/30 to-violet-900/30 rounded-lg p-3 border border-sky-800/30">
            <div className="text-[10px] text-sky-400 uppercase tracking-wider mb-1">Answer</div>
            <div className="text-sm text-white font-mono">{analysis.finalAnswer}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ForceTab({ a }: { a: ReturnType<typeof useAnalysisStore.getState> }) {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-slate-200">Force Analysis</h3>
      {a.forces.map((f, i) => (
        <div key={i} className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/50">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm font-medium text-white">{f.name}</span>
            <span className="text-xs text-sky-400 font-mono">{f.symbol}</span>
          </div>
          <div className="text-xs text-slate-400 space-y-1">
            <div>Direction: {f.direction}</div>
            <div className="font-mono text-sky-300">{f.magnitude}</div>
            <div className="text-slate-500 mt-1">{f.description}</div>
          </div>
        </div>
      ))}
      <div className="bg-amber-900/20 border border-amber-800/30 rounded-lg p-2.5 text-xs text-amber-300">
        Only gravity acts on the ball. Air resistance is ignored.
      </div>
    </div>
  );
}

function MotionTab({ a }: { a: ReturnType<typeof useAnalysisStore.getState> }) {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-slate-200">Motion Analysis</h3>
      {a.motionSteps.map((step, i) => (
        <div key={i} className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/50">
          <div className="flex items-start gap-2">
            <span className="w-5 h-5 rounded-full bg-sky-900/50 border border-sky-700/50
              flex items-center justify-center text-[10px] text-sky-400 flex-shrink-0 mt-0.5">
              {i + 1}
            </span>
            <div>
              <div className="text-sm font-medium text-white">{step.title}</div>
              <div className="text-xs text-slate-400 mt-1">{step.content}</div>
              {step.formula && (
                <div className="mt-1.5 px-2 py-1 bg-slate-900 rounded text-xs font-mono text-sky-300">
                  {step.formula}
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function DerivationTab({ a }: { a: ReturnType<typeof useAnalysisStore.getState> }) {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-slate-200">Formula Derivation</h3>
      {a.derivation.map((step) => (
        <div key={step.step} className="relative pl-6 pb-4 border-l-2 border-slate-700 last:pb-0">
          <div className="absolute -left-2.5 top-0 w-5 h-5 rounded-full bg-sky-600
            flex items-center justify-center text-[10px] text-white font-bold">
            {step.step}
          </div>
          <div className="text-sm font-medium text-white">{step.title}</div>
          <div className="mt-1 px-2 py-1.5 bg-slate-800 rounded text-xs font-mono text-sky-300">
            {step.formula}
          </div>
          <div className="text-xs text-slate-500 mt-1">{step.explanation}</div>
        </div>
      ))}
    </div>
  );
}

function KnowledgeTab({ a }: { a: ReturnType<typeof useAnalysisStore.getState> }) {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-slate-200">Related Topics</h3>
      <div className="flex flex-wrap gap-2">
        {a.knowledgePoints.map((kp) => (
          <div key={kp.id}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
              kp.mastered
                ? "bg-emerald-900/30 border-emerald-700/50 text-emerald-400"
                : "bg-slate-800/50 border-slate-700/50 text-slate-400"
            }`}>
            {kp.mastered ? "[v] " : "[ ] "}
            {kp.name}
            <span className="ml-1 text-[10px] opacity-60">{kp.category}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function TipsTab({ a }: { a: ReturnType<typeof useAnalysisStore.getState> }) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-amber-400 mb-2">Common Mistakes</h3>
        <div className="space-y-2">
          {a.commonMistakes.map((m, i) => (
            <div key={i} className="flex items-start gap-2 bg-amber-900/10 border border-amber-800/20 rounded-lg p-2.5">
              <span className="text-amber-500 text-xs mt-0.5">!</span>
              <span className="text-xs text-slate-300">{m}</span>
            </div>
          ))}
        </div>
      </div>
      <div>
        <h3 className="text-sm font-semibold text-emerald-400 mb-2">Learning Tips</h3>
        <div className="space-y-2">
          {a.learningTips.map((t, i) => (
            <div key={i} className="flex items-start gap-2 bg-emerald-900/10 border border-emerald-800/20 rounded-lg p-2.5">
              <span className="text-emerald-500 text-xs mt-0.5">{">"}</span>
              <span className="text-xs text-slate-300">{t}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
