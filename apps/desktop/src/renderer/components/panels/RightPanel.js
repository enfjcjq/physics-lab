import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { usePanelManager } from "../../core/panel-manager.store";
import { useUIStore } from "../../stores/ui.store";
import { useAnalysisStore } from "../../stores/analysis.store";
import { CollapseHandle } from "../layout/CollapseHandle";
const ANALYSIS_TABS = [
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
    return (_jsx("div", { className: `relative flex-shrink-0 transition-all duration-300 ease-in-out overflow-hidden
      ${rightOpen ? "w-[340px]" : "w-0"}`, children: _jsxs("div", { className: "w-[340px] h-full bg-slate-900/95 border-l border-slate-800 flex flex-col", children: [_jsx(CollapseHandle, { side: "right", open: rightOpen, onToggle: toggleRight }), _jsx("div", { className: "px-4 pt-4 pb-2", children: _jsx("h2", { className: "text-xs font-semibold text-slate-400 uppercase tracking-wider", children: "AI Analysis" }) }), _jsx("div", { className: "px-2 pb-3", children: _jsx("div", { className: "flex flex-wrap gap-1", children: ANALYSIS_TABS.map((tab) => (_jsx("button", { onClick: () => setTab(tab.id), className: `px-2.5 py-1.5 text-xs rounded-md transition-all whitespace-nowrap ${activeTab === tab.id
                                ? "bg-sky-600/20 text-sky-400 border border-sky-600/30"
                                : "text-slate-500 hover:text-slate-300 hover:bg-slate-800/50"}`, children: tab.label }, tab.id))) }) }), _jsx("div", { className: "border-t border-slate-800" }), _jsxs("div", { className: "flex-1 overflow-y-auto px-4 py-3", children: [activeTab === "force" && _jsx(ForceTab, { a: analysis }), activeTab === "motion" && _jsx(MotionTab, { a: analysis }), activeTab === "derivation" && _jsx(DerivationTab, { a: analysis }), activeTab === "knowledge" && _jsx(KnowledgeTab, { a: analysis }), activeTab === "tips" && _jsx(TipsTab, { a: analysis })] }), _jsx("div", { className: "border-t border-slate-800 px-4 py-3", children: _jsxs("div", { className: "bg-gradient-to-r from-sky-900/30 to-violet-900/30 rounded-lg p-3 border border-sky-800/30", children: [_jsx("div", { className: "text-[10px] text-sky-400 uppercase tracking-wider mb-1", children: "Answer" }), _jsx("div", { className: "text-sm text-white font-mono", children: analysis.finalAnswer })] }) })] }) }));
}
function ForceTab({ a }) {
    return (_jsxs("div", { className: "space-y-3", children: [_jsx("h3", { className: "text-sm font-semibold text-slate-200", children: "Force Analysis" }), a.forces.map((f, i) => (_jsxs("div", { className: "bg-slate-800/50 rounded-lg p-3 border border-slate-700/50", children: [_jsxs("div", { className: "flex items-center gap-2 mb-2", children: [_jsx("span", { className: "text-sm font-medium text-white", children: f.name }), _jsx("span", { className: "text-xs text-sky-400 font-mono", children: f.symbol })] }), _jsxs("div", { className: "text-xs text-slate-400 space-y-1", children: [_jsxs("div", { children: ["Direction: ", f.direction] }), _jsx("div", { className: "font-mono text-sky-300", children: f.magnitude }), _jsx("div", { className: "text-slate-500 mt-1", children: f.description })] })] }, i))), _jsx("div", { className: "bg-amber-900/20 border border-amber-800/30 rounded-lg p-2.5 text-xs text-amber-300", children: "Only gravity acts on the ball. Air resistance is ignored." })] }));
}
function MotionTab({ a }) {
    return (_jsxs("div", { className: "space-y-3", children: [_jsx("h3", { className: "text-sm font-semibold text-slate-200", children: "Motion Analysis" }), a.motionSteps.map((step, i) => (_jsx("div", { className: "bg-slate-800/50 rounded-lg p-3 border border-slate-700/50", children: _jsxs("div", { className: "flex items-start gap-2", children: [_jsx("span", { className: "w-5 h-5 rounded-full bg-sky-900/50 border border-sky-700/50\r\n              flex items-center justify-center text-[10px] text-sky-400 flex-shrink-0 mt-0.5", children: i + 1 }), _jsxs("div", { children: [_jsx("div", { className: "text-sm font-medium text-white", children: step.title }), _jsx("div", { className: "text-xs text-slate-400 mt-1", children: step.content }), step.formula && (_jsx("div", { className: "mt-1.5 px-2 py-1 bg-slate-900 rounded text-xs font-mono text-sky-300", children: step.formula }))] })] }) }, i)))] }));
}
function DerivationTab({ a }) {
    return (_jsxs("div", { className: "space-y-3", children: [_jsx("h3", { className: "text-sm font-semibold text-slate-200", children: "Formula Derivation" }), a.derivation.map((step) => (_jsxs("div", { className: "relative pl-6 pb-4 border-l-2 border-slate-700 last:pb-0", children: [_jsx("div", { className: "absolute -left-2.5 top-0 w-5 h-5 rounded-full bg-sky-600\r\n            flex items-center justify-center text-[10px] text-white font-bold", children: step.step }), _jsx("div", { className: "text-sm font-medium text-white", children: step.title }), _jsx("div", { className: "mt-1 px-2 py-1.5 bg-slate-800 rounded text-xs font-mono text-sky-300", children: step.formula }), _jsx("div", { className: "text-xs text-slate-500 mt-1", children: step.explanation })] }, step.step)))] }));
}
function KnowledgeTab({ a }) {
    return (_jsxs("div", { className: "space-y-3", children: [_jsx("h3", { className: "text-sm font-semibold text-slate-200", children: "Related Topics" }), _jsx("div", { className: "flex flex-wrap gap-2", children: a.knowledgePoints.map((kp) => (_jsxs("div", { className: `px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${kp.mastered
                        ? "bg-emerald-900/30 border-emerald-700/50 text-emerald-400"
                        : "bg-slate-800/50 border-slate-700/50 text-slate-400"}`, children: [kp.mastered ? "[v] " : "[ ] ", kp.name, _jsx("span", { className: "ml-1 text-[10px] opacity-60", children: kp.category })] }, kp.id))) })] }));
}
function TipsTab({ a }) {
    return (_jsxs("div", { className: "space-y-4", children: [_jsxs("div", { children: [_jsx("h3", { className: "text-sm font-semibold text-amber-400 mb-2", children: "Common Mistakes" }), _jsx("div", { className: "space-y-2", children: a.commonMistakes.map((m, i) => (_jsxs("div", { className: "flex items-start gap-2 bg-amber-900/10 border border-amber-800/20 rounded-lg p-2.5", children: [_jsx("span", { className: "text-amber-500 text-xs mt-0.5", children: "!" }), _jsx("span", { className: "text-xs text-slate-300", children: m })] }, i))) })] }), _jsxs("div", { children: [_jsx("h3", { className: "text-sm font-semibold text-emerald-400 mb-2", children: "Learning Tips" }), _jsx("div", { className: "space-y-2", children: a.learningTips.map((t, i) => (_jsxs("div", { className: "flex items-start gap-2 bg-emerald-900/10 border border-emerald-800/20 rounded-lg p-2.5", children: [_jsx("span", { className: "text-emerald-500 text-xs mt-0.5", children: ">" }), _jsx("span", { className: "text-xs text-slate-300", children: t })] }, i))) })] })] }));
}
//# sourceMappingURL=RightPanel.js.map