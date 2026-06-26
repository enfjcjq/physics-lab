import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useProblemStore } from "../../stores/problem.store";
import { usePanelManager } from "../../core/panel-manager.store";
import { useTeaching } from "../../core/teaching.store";
import { useSimulation } from "../../features/experiment/experiment.store";
import { useI18n } from "../../core/i18n";
import { CollapseHandle } from "../layout/CollapseHandle";
import { pluginRegistry } from "../../core/plugin-registry";
const INPUT_TABS = [
    { id: "text", label: "Text" }, { id: "ocr", label: "OCR" }, { id: "image", label: "Image" }, { id: "pdf", label: "PDF" },
];
export function LeftPanel() {
    const leftOpen = usePanelManager((s) => s.panels.problem?.isOpen ?? true);
    const toggleLeft = () => usePanelManager.getState().toggle("problem");
    const inputMethod = useProblemStore((s) => s.inputMethod);
    const setInputMethod = useProblemStore((s) => s.setInputMethod);
    const inputText = useProblemStore((s) => s.inputText);
    const setInputText = useProblemStore((s) => s.setInputText);
    const isSubmitting = useProblemStore((s) => s.isSubmitting);
    const parseError = useProblemStore((s) => s.parseError);
    const submit = useProblemStore((s) => s.submit);
    const history = useProblemStore((s) => s.history);
    const { mode } = useTeaching();
    const { t } = useI18n();
    const setScene = useSimulation((s) => s.setScene);
    const mass = useSimulation((s) => s.mass);
    const height = useSimulation((s) => s.height);
    const gravity = useSimulation((s) => s.gravity);
    const setMass = useSimulation((s) => s.setMass);
    const setHeight = useSimulation((s) => s.setHeight);
    const setGravity = useSimulation((s) => s.setGravity);
    const jumpToTime = useSimulation((s) => s.jumpToTime);
    const currentTime = useSimulation((s) => s.currentTime);
    const activePluginId = useSimulation((s) => s.activePluginId);
    const setActivePlugin = useSimulation((s) => s.setActivePlugin);
    const showFullInput = mode !== "learning";
    const handleSubmit = async () => {
        const scene = await submit();
        if (scene)
            setScene(scene);
    };
    return (_jsx("div", { className: `relative flex-shrink-0 transition-all duration-300 ease-in-out overflow-hidden ${leftOpen ? "w-[280px]" : "w-0"}`, children: _jsxs("div", { className: "w-[280px] h-full bg-slate-900/95 border-r border-slate-800 flex flex-col", children: [_jsx(CollapseHandle, { side: "left", open: leftOpen, onToggle: toggleLeft }), _jsx("div", { className: "px-4 pt-4 pb-2", children: _jsx("h2", { className: "text-xs font-semibold text-slate-400 uppercase tracking-wider", children: t("panel.problem") }) }), _jsx("div", { className: "px-4 pb-3", children: _jsx("select", { value: activePluginId, onChange: (e) => setActivePlugin(e.target.value), className: "w-full bg-slate-800/50 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-sky-600 cursor-pointer", children: pluginRegistry.list().map((p) => (_jsxs("option", { value: p.id, children: [p.name, " (", p.difficulty, ")"] }, p.id))) }) }), showFullInput && (_jsx("div", { className: "px-4 pb-2", children: _jsx("div", { className: "flex bg-slate-800/50 rounded-lg p-0.5", children: INPUT_TABS.map((tab) => (_jsx("button", { onClick: () => setInputMethod(tab.id), className: `flex-1 py-1.5 text-xs rounded-md transition-all ${inputMethod === tab.id ? "bg-sky-600 text-white shadow" : "text-slate-400 hover:text-slate-200"}`, children: tab.label }, tab.id))) }) })), _jsxs("div", { className: "px-4 flex-1 flex flex-col min-h-0", children: [inputMethod === "text" && (_jsx("textarea", { value: inputText, onChange: (e) => setInputText(e.target.value), placeholder: t("input.placeholder"), className: "flex-1 bg-slate-800/50 border border-slate-700 rounded-lg p-3 text-sm text-slate-200 placeholder-slate-500 resize-none focus:outline-none focus:border-sky-600 transition-colors min-h-[100px]", spellCheck: false })), showFullInput && (inputMethod !== "text") && (_jsx("div", { className: "flex-1 border-2 border-dashed border-slate-700 rounded-lg flex items-center justify-center text-slate-500 text-sm cursor-pointer hover:border-sky-600 hover:text-sky-400 transition-colors min-h-[100px]", children: _jsxs("div", { className: "text-center", children: [_jsx("div", { className: "text-3xl mb-1", children: "+" }), _jsx("div", { children: "Click or drop file" })] }) })), parseError && _jsx("div", { className: "mt-2 text-[10px] text-red-400 px-1", children: parseError })] }), _jsx("div", { className: "px-4 py-3", children: _jsx("button", { onClick: handleSubmit, disabled: isSubmitting, className: "w-full py-2.5 rounded-lg text-sm font-medium transition-all bg-gradient-to-r from-sky-600 to-violet-600 hover:from-sky-500 hover:to-violet-500 text-white disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-sky-900/20", children: isSubmitting ? t("input.parsing") : t("input.submit") }) }), mode === "experiment" && (_jsxs("div", { className: "border-t border-slate-800 px-4 py-3 space-y-3", children: [_jsx("h2", { className: "text-xs font-semibold text-slate-400 uppercase tracking-wider", children: t("panel.parameters") }), _jsx(SliderControl, { label: t("ctrl.height"), value: height, min: 1, max: 50, step: 0.5, unit: "m", onChange: (v) => { setHeight(v); jumpToTime(currentTime); } }), _jsx(SliderControl, { label: t("ctrl.gravity"), value: gravity, min: 0.1, max: 30, step: 0.1, unit: "m/s^2", onChange: (v) => { setGravity(v); jumpToTime(currentTime); } }), _jsx(SliderControl, { label: t("ctrl.mass"), value: mass, min: 0.1, max: 10, step: 0.1, unit: "kg", onChange: (v) => { setMass(v); jumpToTime(currentTime); } })] })), _jsx("div", { className: "border-t border-slate-800" }), _jsxs("div", { className: "flex-1 flex flex-col min-h-0", children: [_jsxs("div", { className: "px-4 py-2 flex items-center justify-between", children: [_jsx("h2", { className: "text-xs font-semibold text-slate-400 uppercase tracking-wider", children: t("panel.history") }), _jsxs("span", { className: "text-[10px] text-slate-600", children: [history.length, " items"] })] }), _jsxs("div", { className: "flex-1 overflow-y-auto px-2 pb-2", children: [history.length === 0 && _jsx("div", { className: "px-3 py-6 text-center text-xs text-slate-600", children: t("ui.no_history") }), history.map((item) => (_jsxs("div", { className: "px-3 py-2.5 rounded-lg cursor-pointer hover:bg-slate-800/60 transition-colors mb-1", children: [_jsx("div", { className: "text-sm text-slate-300 truncate", children: item.title }), _jsxs("div", { className: "flex items-center gap-2 mt-1", children: [_jsx("span", { className: "text-[10px] text-slate-600", children: new Date(item.timestamp).toLocaleDateString() }), _jsx("span", { className: "text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-500", children: item.inputMethod })] })] }, item.id)))] })] })] }) }));
}
function SliderControl({ label, value, min, max, step, unit, onChange }) {
    return _jsxs("div", { className: "space-y-1", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("span", { className: "text-[10px] text-slate-500", children: label }), _jsxs("span", { className: "text-[10px] font-mono text-sky-400", children: [value.toFixed(1), " ", unit] })] }), _jsx("input", { type: "range", min: min, max: max, step: step, value: value, onChange: (e) => onChange(parseFloat(e.target.value)), className: "w-full h-1.5 bg-slate-700 rounded-full appearance-none cursor-pointer accent-sky-500 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-sky-400" })] });
}
//# sourceMappingURL=LeftPanel.js.map