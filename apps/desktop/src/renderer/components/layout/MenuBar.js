import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useRef, useEffect } from "react";
import { usePanelManager } from "../../core/panel-manager.store";
import { useI18n } from "../../core/i18n";
import { useTheme } from "../../core/theme.store";
import { useTeaching } from "../../core/teaching.store";
import { useVisualization } from "../../core/visualization.store";
import { useSimulation } from "../../features/experiment/experiment.store";
import { generateMarkdownReport, generateHTMLReport, downloadReport, downloadFile } from "../../lib/report";
// ===== Dropdown Menu =====
function Dropdown({ label, children }) {
    const [open, setOpen] = useState(false);
    const ref = useRef(null);
    useEffect(() => {
        function handleClick(e) {
            if (ref.current && !ref.current.contains(e.target))
                setOpen(false);
        }
        document.addEventListener("mousedown", handleClick);
        return () => document.removeEventListener("mousedown", handleClick);
    }, []);
    return (_jsx(_Fragment, { children: _jsxs("div", { ref: ref, className: "relative", children: [_jsx("button", { onClick: () => setOpen(!open), className: `px-3 py-1.5 text-xs rounded transition-colors ${open ? "bg-slate-700 text-white" : "text-slate-400 hover:text-white hover:bg-slate-800"}`, children: label }), open && (_jsx("div", { className: "absolute top-full left-0 mt-1 w-56 bg-slate-800 border border-slate-700 rounded-lg shadow-2xl py-1 z-50", children: children }))] }) }));
}
function MenuItem({ label, shortcut, onClick, checked, }) {
    return (_jsxs("button", { onClick: onClick, className: "w-full flex items-center px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-700 hover:text-white transition-colors text-left", children: [_jsx("span", { className: "w-4", children: checked ? "✓" : checked === false ? "  " : "" }), _jsx("span", { className: "flex-1", children: label }), shortcut && _jsx("span", { className: "text-slate-500 ml-4", children: shortcut })] }));
}
function MenuSeparator() {
    return _jsx("div", { className: "border-t border-slate-700 my-1" });
}
// ===== MenuBar =====
export function MenuBar() {
    const { t, locale, setLocale } = useI18n();
    const { mode, setMode } = useTheme();
    const { mode: appMode, subMode: teachingMode, setSubMode: setTeachingMode } = useTeaching();
    const panelMgr = usePanelManager();
    const viz = useVisualization();
    const [showAbout, setShowAbout] = useState(false);
    const sim = useSimulation();
    const handleExport = () => {
        const scene = sim.scene;
        if (!scene)
            return;
        const report = generateMarkdownReport({
            scene,
            params: { mass: sim.mass, height: sim.height, gravity: sim.gravity },
            currentTime: sim.currentTime,
            ballY: sim.ballY,
            ballVelocity: sim.ballVelocity,
        }, locale);
        const ts = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
        downloadReport(report, `physics-lab-report-${ts}.md`);
    };
    const panelItems = panelMgr.panelDefs.map((def) => ({
        id: def.id,
        label: t(def.titleKey),
        open: panelMgr.panels[def.id]?.isOpen ?? false,
    }));
    const MODE_LABELS = {
        experiment: t("mode.experiment"),
        teaching: t("mode.teaching"),
        solving: t("mode.solving"),
        explore: t("mode.explore"),
    };
    return (_jsxs(_Fragment, { children: [_jsxs("div", { className: "h-8 bg-slate-900 border-b border-slate-800 flex items-center px-2 select-none flex-shrink-0", style: { WebkitAppRegion: "drag" }, children: [_jsxs(Dropdown, { label: t("menu.file"), children: [_jsx(MenuItem, { label: t("menu.file.new"), shortcut: "Ctrl+N" }), _jsx(MenuItem, { label: t("menu.file.open"), shortcut: "Ctrl+O" }), _jsx(MenuItem, { label: t("menu.file.save"), shortcut: "Ctrl+S" }), _jsx(MenuSeparator, {}), _jsx(MenuItem, { label: t("menu.file.export") + " (MD)", shortcut: "Ctrl+E", onClick: handleExport }), _jsx(MenuItem, { label: t("menu.file.export") + " (HTML)", shortcut: "Ctrl+H", onClick: () => {
                                    const scene = sim.scene;
                                    if (!scene)
                                        return;
                                    const data = { scene, params: { mass: sim.mass, height: sim.height, gravity: sim.gravity }, currentTime: sim.currentTime, ballY: sim.ballY, ballVelocity: sim.ballVelocity };
                                    const html = generateHTMLReport(data, locale);
                                    const ts = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
                                    downloadFile(html, `physics-lab-report-${ts}.html`, "text/html");
                                } }), _jsx(MenuSeparator, {}), _jsx(MenuItem, { label: t("menu.file.exit") })] }), appMode !== "learning" && (_jsxs(Dropdown, { label: t("menu.edit"), children: [_jsx(MenuItem, { label: t("menu.edit.undo"), shortcut: "Ctrl+Z" }), _jsx(MenuItem, { label: t("menu.edit.redo"), shortcut: "Ctrl+Y" }), _jsx(MenuSeparator, {}), _jsx(MenuItem, { label: t("menu.edit.reset") })] })), _jsxs(Dropdown, { label: t("menu.view"), children: [panelItems.map((p) => (_jsx(MenuItem, { label: p.label, checked: p.open, onClick: () => panelMgr.toggle(p.id) }, p.id))), _jsx(MenuSeparator, {}), _jsx(MenuItem, { label: t("menu.view.coordinates"), checked: viz.toggles.showAxes, onClick: () => viz.toggle("showAxes") }), _jsx(MenuItem, { label: t("menu.view.forces"), checked: viz.toggles.showGravityArrow, onClick: () => viz.toggle("showGravityArrow") }), _jsx(MenuItem, { label: t("menu.view.grid"), checked: viz.toggles.showGrid, onClick: () => viz.toggle("showGrid") }), _jsx(MenuItem, { label: t("menu.view.trail"), checked: viz.toggles.showTrail, onClick: () => viz.toggle("showTrail") }), _jsx(MenuSeparator, {}), _jsx(MenuItem, { label: t("menu.view.reset_layout"), onClick: () => panelMgr.resetLayout() })] }), _jsxs(Dropdown, { label: t("menu.experiment"), children: [_jsx(MenuItem, { label: t("ctrl.play"), shortcut: "Space" }), _jsx(MenuItem, { label: t("ctrl.pause"), shortcut: "Space" }), _jsx(MenuItem, { label: t("ctrl.stop") }), _jsx(MenuItem, { label: t("ctrl.replay"), shortcut: "Ctrl+R" }), _jsx(MenuSeparator, {}), _jsx(MenuItem, { label: t("ctrl.prevFrame"), shortcut: "←" }), _jsx(MenuItem, { label: t("ctrl.nextFrame"), shortcut: "→" }), _jsx(MenuSeparator, {}), _jsx(MenuItem, { label: "0.25x" }), _jsx(MenuItem, { label: "0.5x" }), _jsx(MenuItem, { label: "1x", checked: true }), _jsx(MenuItem, { label: "2x" }), _jsx(MenuItem, { label: "4x" })] }), _jsxs(Dropdown, { label: t("menu.teaching"), children: [_jsx(MenuItem, { label: t("teaching.mode.experiment"), checked: teachingMode === "experiment", onClick: () => setTeachingMode("experiment") }), _jsx(MenuItem, { label: t("teaching.mode.teaching"), checked: teachingMode === "teaching", onClick: () => setTeachingMode("teaching") }), _jsx(MenuItem, { label: t("teaching.mode.solving"), checked: teachingMode === "solving", onClick: () => setTeachingMode("solving") }), _jsx(MenuItem, { label: t("teaching.mode.explore"), checked: teachingMode === "explore", onClick: () => setTeachingMode("explore") }), _jsx(MenuSeparator, {}), _jsx(MenuItem, { label: t("menu.teaching.knowledge"), checked: true }), _jsx(MenuItem, { label: t("menu.teaching.forces"), checked: true }), _jsx(MenuItem, { label: t("menu.teaching.motion"), checked: true }), _jsx(MenuItem, { label: t("menu.teaching.derivation"), checked: true }), _jsx(MenuItem, { label: t("menu.teaching.tips"), checked: true }), _jsx(MenuSeparator, {}), _jsx(MenuItem, { label: t("menu.teaching.answer"), checked: true })] }), _jsx("div", { className: "flex-1" }), _jsxs(Dropdown, { label: t("menu.language"), children: [_jsx(MenuItem, { label: "English", checked: locale === "en-US", onClick: () => setLocale("en-US") }), _jsx(MenuItem, { label: "中文", checked: locale === "zh-CN", onClick: () => setLocale("zh-CN") })] }), _jsxs(Dropdown, { label: t("menu.theme"), children: [_jsx(MenuItem, { label: t("menu.theme.dark"), checked: mode === "dark", onClick: () => setMode("dark") }), _jsx(MenuItem, { label: t("menu.theme.light"), checked: mode === "light", onClick: () => setMode("light") }), _jsx(MenuItem, { label: t("menu.theme.auto"), checked: mode === "auto", onClick: () => setMode("auto") })] }), _jsxs(Dropdown, { label: t("menu.help"), children: [_jsx(MenuItem, { label: t("about.title"), onClick: () => setShowAbout(true) }), _jsx(MenuItem, { label: "Documentation" }), _jsx(MenuSeparator, {}), _jsx(MenuItem, { label: "Version 2.0.0" })] })] }), showAbout && (_jsx("div", { className: "fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm", onClick: () => setShowAbout(false), children: _jsxs("div", { className: "bg-slate-900 border border-slate-700 rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl", onClick: (e) => e.stopPropagation(), children: [_jsxs("div", { className: "text-center mb-6", children: [_jsx("div", { className: "w-14 h-14 mx-auto mb-3 rounded-2xl bg-gradient-to-br from-sky-600 to-violet-600 flex items-center justify-center text-2xl", children: "\\u269B" }), _jsx("h2", { className: "text-xl font-bold text-white", children: t("about.title") }), _jsxs("p", { className: "text-xs text-slate-500 mt-1", children: [t("about.version"), " 2.0.0"] })] }), _jsx("p", { className: "text-sm text-slate-400 leading-relaxed mb-4", children: t("about.desc") }), _jsxs("div", { className: "bg-slate-800/50 rounded-xl p-4 mb-4", children: [_jsx("h3", { className: "text-xs text-slate-500 uppercase tracking-wider mb-2", children: t("about.tech") }), _jsx("div", { className: "flex flex-wrap gap-1.5", children: ["Electron", "React", "TypeScript", "Three.js", "Zustand", "TailwindCSS", "Vite"].map((tech) => (_jsx("span", { className: "px-2 py-0.5 rounded text-[10px] bg-slate-700/50 text-slate-400", children: tech }, tech))) })] }), _jsx("button", { onClick: () => setShowAbout(false), className: "w-full py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-sm font-medium", children: t("about.close") })] }) }))] }));
}
//# sourceMappingURL=MenuBar.js.map