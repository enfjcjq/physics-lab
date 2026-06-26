import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useRef, useCallback } from "react";
import { usePanelManager } from "../../core/panel-manager.store";
import { useUIStore } from "../../stores/ui.store";
import { useSimulation } from "../../features/experiment/experiment.store";
const CHART_TABS = [
    { id: "timeline", label: "Timeline" },
    { id: "vt", label: "v-t" },
    { id: "st", label: "s-t" },
    { id: "energy", label: "Energy" },
];
export function BottomDrawer() {
    const drawerOpen = usePanelManager((s) => s.panels.charts?.isOpen ?? true);
    const drawerHeight = useUIStore((s) => s.drawerHeight);
    const setDrawerHeight = useUIStore((s) => s.setDrawerHeight);
    const toggleDrawer = () => {
        const mgr = usePanelManager.getState();
        mgr.toggle("charts");
        mgr.toggle("timeline");
    };
    const activeTab = useUIStore((s) => s.activeChartTab);
    const setTab = useUIStore((s) => s.setChartTab);
    const mass = useSimulation((s) => s.mass);
    const gravity = useSimulation((s) => s.gravity);
    const height = useSimulation((s) => s.height);
    const trail = useSimulation((s) => s.trail);
    const isDragging = useRef(false);
    const startY = useRef(0);
    const startHeight = useRef(0);
    const onMouseDown = useCallback((e) => {
        isDragging.current = true;
        startY.current = e.clientY;
        startHeight.current = drawerHeight;
        document.addEventListener("mousemove", onMouseMove);
        document.addEventListener("mouseup", onMouseUp);
    }, [drawerHeight]);
    const onMouseMove = useCallback((e) => {
        if (!isDragging.current)
            return;
        const delta = startY.current - e.clientY;
        const newH = Math.max(150, Math.min(500, startHeight.current + delta));
        setDrawerHeight(newH);
    }, [setDrawerHeight]);
    const onMouseUp = useCallback(() => {
        isDragging.current = false;
        document.removeEventListener("mousemove", onMouseMove);
        document.removeEventListener("mouseup", onMouseUp);
    }, [onMouseMove]);
    return (_jsxs("div", { className: "flex-shrink-0 border-t border-slate-800 bg-slate-900/95 transition-all duration-300", style: { height: drawerOpen ? `${drawerHeight}px` : "0px", overflow: "hidden" }, children: [_jsx("div", { onMouseDown: onMouseDown, className: "h-1.5 bg-slate-800 hover:bg-sky-700 cursor-ns-resize transition-colors\r\n          flex items-center justify-center group", children: _jsx("div", { className: "w-8 h-0.5 rounded-full bg-slate-600 group-hover:bg-sky-400 transition-colors" }) }), _jsxs("div", { className: "flex items-center px-4 py-1.5 gap-1", children: [CHART_TABS.map((tab) => (_jsx("button", { onClick: () => setTab(tab.id), className: `px-3 py-1 rounded-md text-xs transition-all ${activeTab === tab.id
                            ? "bg-sky-600/20 text-sky-400 border border-sky-600/30"
                            : "text-slate-500 hover:text-slate-300"}`, children: tab.label }, tab.id))), _jsx("div", { className: "flex-1" }), _jsx("button", { onClick: toggleDrawer, className: "px-2 py-1 text-xs text-slate-500 hover:text-slate-300", children: drawerOpen ? "v" : "^" })] }), _jsxs("div", { className: "px-4 pb-3", style: { height: "calc(100% - 44px)" }, children: [activeTab === "timeline" && _jsx(TimelineChart, { trail: trail, height: height }), activeTab === "vt" && _jsx(VTChart, { trail: trail, gravity: gravity }), activeTab === "st" && _jsx(STChart, { trail: trail, height: height, gravity: gravity }), activeTab === "energy" && (_jsx(EnergyChart, { trail: trail, mass: mass, gravity: gravity, height: height }))] })] }));
}
function TimelineChart({ trail, height: initialH }) {
    const w = 800;
    const h = 140;
    const pad = { top: 15, right: 20, bottom: 20, left: 45 };
    const plotW = w - pad.left - pad.right;
    const plotH = h - pad.top - pad.bottom;
    return (_jsxs("svg", { viewBox: `0 0 ${w} ${h}`, className: "w-full h-full", preserveAspectRatio: "xMidYMid meet", children: [_jsx("line", { x1: pad.left, y1: pad.top, x2: pad.left, y2: pad.top + plotH, stroke: "#475569", strokeWidth: 1 }), _jsx("line", { x1: pad.left, y1: pad.top + plotH, x2: pad.left + plotW, y2: pad.top + plotH, stroke: "#475569", strokeWidth: 1 }), _jsx("polyline", { fill: "none", stroke: "#38bdf8", strokeWidth: 1.5, points: trail.map((p, i) => {
                    const x = pad.left + (i / Math.max(trail.length - 1, 1)) * plotW;
                    const y = pad.top + (1 - p.y / initialH) * plotH;
                    return `${x},${y}`;
                }).join(" ") })] }));
}
function VTChart({ trail, gravity }) {
    const w = 800;
    const h = 140;
    const pad = { top: 15, right: 20, bottom: 20, left: 45 };
    const plotW = w - pad.left - pad.right;
    const plotH = h - pad.top - pad.bottom;
    const maxV = gravity * 2;
    return (_jsxs("svg", { viewBox: `0 0 ${w} ${h}`, className: "w-full h-full", preserveAspectRatio: "xMidYMid meet", children: [_jsx("line", { x1: pad.left, y1: pad.top, x2: pad.left, y2: pad.top + plotH, stroke: "#475569", strokeWidth: 1 }), _jsx("line", { x1: pad.left, y1: pad.top + plotH / 2, x2: pad.left + plotW, y2: pad.top + plotH / 2, stroke: "#334155", strokeWidth: 0.5 }), _jsx("line", { x1: pad.left, y1: pad.top + plotH, x2: pad.left + plotW, y2: pad.top + plotH, stroke: "#475569", strokeWidth: 1 }), _jsx("polyline", { fill: "none", stroke: "#f59e0b", strokeWidth: 1.5, points: trail.map((p, i) => {
                    const x = pad.left + (i / Math.max(trail.length - 1, 1)) * plotW;
                    const v = gravity * (i / 60);
                    const y = pad.top + plotH / 2 - (v / maxV) * (plotH / 2);
                    return `${x},${Math.max(pad.top, Math.min(pad.top + plotH, y))}`;
                }).join(" ") })] }));
}
function STChart({ trail, height: initialH, gravity }) {
    const w = 800;
    const h = 140;
    const pad = { top: 15, right: 20, bottom: 20, left: 45 };
    const plotW = w - pad.left - pad.right;
    const plotH = h - pad.top - pad.bottom;
    return (_jsxs("svg", { viewBox: `0 0 ${w} ${h}`, className: "w-full h-full", preserveAspectRatio: "xMidYMid meet", children: [_jsx("line", { x1: pad.left, y1: pad.top, x2: pad.left, y2: pad.top + plotH, stroke: "#475569", strokeWidth: 1 }), _jsx("line", { x1: pad.left, y1: pad.top + plotH, x2: pad.left + plotW, y2: pad.top + plotH, stroke: "#475569", strokeWidth: 1 }), _jsx("polyline", { fill: "none", stroke: "#22c55e", strokeWidth: 1.5, points: trail.map((p, i) => {
                    const x = pad.left + (i / Math.max(trail.length - 1, 1)) * plotW;
                    const s = initialH - p.y;
                    const y = pad.top + (1 - s / initialH) * plotH;
                    return `${x},${y}`;
                }).join(" ") })] }));
}
function EnergyChart({ trail, mass, gravity, height: initialH }) {
    const w = 800;
    const h = 140;
    const pad = { top: 15, right: 20, bottom: 20, left: 50 };
    const plotW = w - pad.left - pad.right;
    const plotH = h - pad.top - pad.bottom;
    const maxE = mass * gravity * initialH;
    return (_jsxs("svg", { viewBox: `0 0 ${w} ${h}`, className: "w-full h-full", preserveAspectRatio: "xMidYMid meet", children: [_jsx("line", { x1: pad.left, y1: pad.top, x2: pad.left, y2: pad.top + plotH, stroke: "#475569", strokeWidth: 1 }), _jsx("line", { x1: pad.left, y1: pad.top + plotH, x2: pad.left + plotW, y2: pad.top + plotH, stroke: "#475569", strokeWidth: 1 }), _jsx("polyline", { fill: "none", stroke: "#f59e0b", strokeWidth: 1.5, points: trail.map((p, i) => {
                    const x = pad.left + (i / Math.max(trail.length - 1, 1)) * plotW;
                    const v = gravity * (i / 60);
                    const ke = 0.5 * mass * v * v;
                    const y = pad.top + (1 - ke / maxE) * plotH;
                    return `${x},${Math.max(pad.top, Math.min(pad.top + plotH, y))}`;
                }).join(" ") }), _jsx("polyline", { fill: "none", stroke: "#22c55e", strokeWidth: 1.5, strokeDasharray: "4 2", points: trail.map((p, i) => {
                    const x = pad.left + (i / Math.max(trail.length - 1, 1)) * plotW;
                    const pe = mass * gravity * p.y;
                    const y = pad.top + (1 - pe / maxE) * plotH;
                    return `${x},${Math.max(pad.top, Math.min(pad.top + plotH, y))}`;
                }).join(" ") }), _jsx("text", { x: pad.left, y: pad.top - 4, fill: "#f59e0b", fontSize: 9, children: "KE" }), _jsx("text", { x: pad.left + 25, y: pad.top - 4, fill: "#22c55e", fontSize: 9, children: "PE" })] }));
}
//# sourceMappingURL=BottomDrawer.js.map