import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { MenuBar } from "./MenuBar";
import { Timeline } from "../timeline/Timeline";
import { usePanelManager } from "../../core/panel-manager.store";
import { useTeaching } from "../../core/teaching.store";
import { useI18n } from "../../core/i18n";
import { LeftPanel } from "../panels/LeftPanel";
import { RightPanel } from "../panels/RightPanel";
import { CenterPanel } from "../panels/CenterPanel";
import { BottomDrawer } from "../panels/BottomDrawer";
import { TeacherPanel } from "../teaching/TeacherPanel";
import { WelcomeScreen } from "./WelcomeScreen";
const MODES = ["learning", "experiment", "analysis"];
export function AppShell() {
    const panels = usePanelManager((s) => s.panels);
    const { mode, setMode } = useTeaching();
    const { t } = useI18n();
    const leftOpen = panels.problem?.isOpen || panels.history?.isOpen || panels.parameters?.isOpen;
    const rightOpen = panels.analysis?.isOpen || panels.teaching?.isOpen || panels.properties?.isOpen;
    const bottomOpen = panels.timeline?.isOpen || panels.charts?.isOpen;
    // Mode-based visibility
    const showLeftPanel = leftOpen;
    const showTeacher = mode === "learning";
    const showRightPanel = (mode === "experiment" || mode === "analysis") && rightOpen;
    // Learning mode: hide bottom drawer for cleaner student experience
    const showBottomDrawer = mode !== "learning" && bottomOpen;
    return (_jsxs("div", { className: "w-full h-full flex flex-col relative", style: { background: "var(--bg-root)" }, children: [_jsx(WelcomeScreen, {}), _jsx(MenuBar, {}), _jsx("div", { className: "h-8 bg-slate-900/80 border-b border-slate-800 flex items-center px-4 gap-2 flex-shrink-0", children: _jsx("div", { className: "flex bg-slate-800/60 rounded-lg p-0.5", children: MODES.map((m) => (_jsx("button", { onClick: () => setMode(m), className: `px-4 py-1 rounded-md text-xs font-medium transition-all duration-200 ${mode === m ? "bg-sky-600 text-white shadow-md" : "text-slate-400 hover:text-slate-200"}`, children: t(`mode.${m}`) }, m))) }) }), _jsxs("div", { className: "flex-1 flex min-h-0", children: [showLeftPanel && (_jsx("div", { className: "flex-shrink-0 border-r flex flex-col transition-all duration-300", style: {
                            width: mode === "learning" ? 260 : 280,
                            borderColor: "var(--border-primary)",
                            background: "var(--bg-primary)",
                        }, children: panels.problem?.isOpen && _jsx(LeftPanel, {}) })), _jsx(CenterPanel, {}), showTeacher && (_jsx("div", { className: "flex-shrink-0 border-l flex flex-col", style: { width: 320, borderColor: "var(--border-primary)", background: "var(--bg-primary)" }, children: _jsx(TeacherPanel, {}) })), showRightPanel && (_jsx("div", { className: "flex-shrink-0 border-l flex flex-col", style: { width: 340, borderColor: "var(--border-primary)", background: "var(--bg-primary)" }, children: panels.analysis?.isOpen && _jsx(RightPanel, {}) }))] }), showBottomDrawer && _jsx(BottomDrawer, {}), _jsx(Timeline, {})] }));
}
//# sourceMappingURL=AppShell.js.map