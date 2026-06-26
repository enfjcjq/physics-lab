import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useRef, useCallback, useEffect, useState } from "react";
import { useSimulation } from "../../features/experiment/experiment.store";
import { PHASES } from "../../stores/ui.store";
import { useI18n } from "../../core/i18n";
// ---- Data ----
const SPEEDS = [
    { label: "0.25x", value: 0.25 },
    { label: "0.5x", value: 0.5 },
    { label: "1x", value: 1 },
    { label: "2x", value: 2 },
    { label: "4x", value: 4 },
];
const PHASE_COLORS = {
    release: "#22c55e",
    falling: "#3b82f6",
    impact: "#f59e0b",
    bounce: "#ef4444",
};
// ---- Sub-components ----
/** A single transport button with SVG icon */
function TransBtn({ onClick, title, active, children, }) {
    return (_jsx("button", { onClick: onClick, title: title, className: `w-7 h-7 rounded flex items-center justify-center transition-all duration-150 ${active
            ? "bg-sky-600 text-white"
            : "text-slate-400 hover:text-white hover:bg-slate-800 active:scale-95"}`, children: children }));
}
// ---- Timeline ----
export function Timeline() {
    // Store
    const playing = useSimulation((s) => s.playing);
    const currentTime = useSimulation((s) => s.currentTime);
    const totalDuration = useSimulation((s) => s.totalDuration);
    const timeScale = useSimulation((s) => s.timeScale);
    const currentPhase = useSimulation((s) => s.currentPhase);
    const play = useSimulation((s) => s.play);
    const pause = useSimulation((s) => s.pause);
    const stop = useSimulation((s) => s.stop);
    const replay = useSimulation((s) => s.replay);
    const stepForward = useSimulation((s) => s.stepForward);
    const stepBackward = useSimulation((s) => s.stepBackward);
    const jumpToTime = useSimulation((s) => s.jumpToTime);
    const jumpToPhase = useSimulation((s) => s.jumpToPhase);
    const setSpeed = useSimulation((s) => s.setSpeed);
    const { t } = useI18n();
    // Local state
    const [loop, setLoop] = useState(false);
    const barRef = useRef(null);
    const dragging = useRef(false);
    const progress = totalDuration > 0 ? (currentTime / totalDuration) * 100 : 0;
    // ---- Coordinate helpers ----
    const getTimeFromClientX = useCallback((clientX) => {
        if (!barRef.current)
            return 0;
        const rect = barRef.current.getBoundingClientRect();
        const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
        return ratio * totalDuration;
    }, [totalDuration]);
    // ---- Bar click ----
    const handleBarClick = useCallback((e) => {
        jumpToTime(getTimeFromClientX(e.clientX));
    }, [jumpToTime, getTimeFromClientX]);
    // ---- Drag ----
    const handleThumbMouseDown = useCallback((e) => {
        e.stopPropagation();
        e.preventDefault();
        dragging.current = true;
        const onMove = (ev) => {
            if (!dragging.current)
                return;
            jumpToTime(getTimeFromClientX(ev.clientX));
        };
        const onUp = () => {
            dragging.current = false;
            document.removeEventListener("mousemove", onMove);
            document.removeEventListener("mouseup", onUp);
        };
        document.addEventListener("mousemove", onMove);
        document.addEventListener("mouseup", onUp);
    }, [jumpToTime, getTimeFromClientX]);
    // ---- Wheel fine-tune ----
    const handleWheel = useCallback((e) => {
        e.preventDefault();
        const step = e.shiftKey ? 0.2 : 0.05;
        const delta = e.deltaY > 0 ? step : -step;
        const newTime = Math.max(0, Math.min(totalDuration, currentTime + delta));
        jumpToTime(newTime);
    }, [currentTime, totalDuration, jumpToTime]);
    // ---- Jump helpers ----
    const skipBack = useCallback(() => {
        jumpToTime(Math.max(0, currentTime - 0.5));
    }, [currentTime, jumpToTime]);
    const skipForward = useCallback(() => {
        jumpToTime(Math.min(totalDuration, currentTime + 0.5));
    }, [currentTime, totalDuration, jumpToTime]);
    const prevPhase = useCallback(() => {
        const idx = PHASES.findIndex((p) => p.id === currentPhase);
        if (idx > 0)
            jumpToPhase(PHASES[idx - 1].id);
    }, [currentPhase, jumpToPhase]);
    const nextPhase = useCallback(() => {
        const idx = PHASES.findIndex((p) => p.id === currentPhase);
        if (idx < PHASES.length - 1)
            jumpToPhase(PHASES[idx + 1].id);
    }, [currentPhase, jumpToPhase]);
    // ---- Keyboard shortcuts ----
    useEffect(() => {
        const handler = (e) => {
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement)
                return;
            switch (e.code) {
                case "Space":
                    e.preventDefault();
                    playing ? pause() : play();
                    break;
                case "ArrowLeft":
                    e.preventDefault();
                    e.shiftKey ? skipBack() : stepBackward();
                    break;
                case "ArrowRight":
                    e.preventDefault();
                    e.shiftKey ? skipForward() : stepForward();
                    break;
                case "Home":
                    e.preventDefault();
                    jumpToTime(0);
                    break;
                case "End":
                    e.preventDefault();
                    jumpToTime(totalDuration);
                    break;
            }
        };
        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, [playing, play, pause, stepForward, stepBackward, skipBack, skipForward, jumpToTime, totalDuration]);
    // ---- Time tick marks ----
    const tickCount = Math.ceil(totalDuration / 0.5);
    const ticks = Array.from({ length: tickCount + 1 }, (_, i) => i * 0.5);
    // ---- Phase index helpers ----
    const phaseIdx = PHASES.findIndex((p) => p.id === currentPhase);
    return (_jsxs("div", { className: "flex-shrink-0 bg-slate-900/95 border-t border-slate-800 select-none", style: { height: 64 }, children: [_jsxs("div", { className: "h-7 flex items-center gap-1.5 px-3", children: [_jsx(TransBtn, { onClick: stop, title: t("ctrl.stop"), children: _jsx("svg", { width: "11", height: "11", viewBox: "0 0 12 12", children: _jsx("rect", { x: "1", y: "1", width: "10", height: "10", rx: "1", fill: "currentColor" }) }) }), _jsx(TransBtn, { onClick: skipBack, title: t("ctrl.skipBack") + " (Shift+←)", children: _jsxs("svg", { width: "12", height: "12", viewBox: "0 0 12 12", children: [_jsx("path", { d: "M7 2L3 6l4 4V2z", stroke: "currentColor", strokeWidth: "1.5", fill: "none" }), _jsx("path", { d: "M10 2L8 6l2 4V2z", stroke: "currentColor", strokeWidth: "1.5", fill: "none" })] }) }), _jsx(TransBtn, { onClick: stepBackward, title: t("ctrl.prevFrame") + " (←)", children: _jsx("svg", { width: "11", height: "11", viewBox: "0 0 12 12", children: _jsx("path", { d: "M9 2L4 6l5 4V2zM3 2v8", stroke: "currentColor", strokeWidth: "1.5", fill: "none" }) }) }), _jsx("button", { onClick: playing ? pause : play, className: "w-8 h-7 rounded-md bg-sky-600 hover:bg-sky-500 text-white flex items-center justify-center transition-all duration-150 active:scale-95", title: playing ? t("ctrl.pause") + " (Space)" : t("ctrl.play") + " (Space)", children: playing ? (_jsxs("svg", { width: "11", height: "11", viewBox: "0 0 12 12", children: [_jsx("rect", { x: "1.5", y: "1", width: "3.5", height: "10", rx: "0.5", fill: "currentColor" }), _jsx("rect", { x: "7", y: "1", width: "3.5", height: "10", rx: "0.5", fill: "currentColor" })] })) : (_jsx("svg", { width: "11", height: "11", viewBox: "0 0 12 12", children: _jsx("path", { d: "M2 1l9 5-9 5V1z", fill: "currentColor" }) })) }), _jsx(TransBtn, { onClick: stepForward, title: t("ctrl.nextFrame") + " (→)", children: _jsx("svg", { width: "11", height: "11", viewBox: "0 0 12 12", children: _jsx("path", { d: "M3 2l5 4-5 4V2zM9 2v8", stroke: "currentColor", strokeWidth: "1.5", fill: "none" }) }) }), _jsx(TransBtn, { onClick: skipForward, title: t("ctrl.skipForward") + " (Shift+→)", children: _jsxs("svg", { width: "12", height: "12", viewBox: "0 0 12 12", children: [_jsx("path", { d: "M5 2l4 4-4 4V2z", stroke: "currentColor", strokeWidth: "1.5", fill: "none" }), _jsx("path", { d: "M2 2l2 4-2 4V2z", stroke: "currentColor", strokeWidth: "1.5", fill: "none" })] }) }), _jsx(TransBtn, { onClick: prevPhase, title: t("ctrl.prevPhase"), children: _jsxs("svg", { width: "12", height: "12", viewBox: "0 0 12 12", children: [_jsx("path", { d: "M10 2L5 6l5 4", stroke: "currentColor", strokeWidth: "1.5", fill: "none" }), _jsx("line", { x1: "2", y1: "2", x2: "2", y2: "10", stroke: "currentColor", strokeWidth: "1.5" })] }) }), _jsx(TransBtn, { onClick: nextPhase, title: t("ctrl.nextPhase"), children: _jsxs("svg", { width: "12", height: "12", viewBox: "0 0 12 12", children: [_jsx("path", { d: "M2 2l5 4-5 4", stroke: "currentColor", strokeWidth: "1.5", fill: "none" }), _jsx("line", { x1: "10", y1: "2", x2: "10", y2: "10", stroke: "currentColor", strokeWidth: "1.5" })] }) }), _jsx(TransBtn, { onClick: replay, title: t("ctrl.replay"), children: _jsxs("svg", { width: "12", height: "12", viewBox: "0 0 12 12", children: [_jsx("path", { d: "M9 2.5A4.5 4.5 0 1010 7", stroke: "currentColor", strokeWidth: "1.5", fill: "none" }), _jsx("path", { d: "M10 3v3H7", stroke: "currentColor", strokeWidth: "1.5", fill: "none" })] }) }), _jsx(TransBtn, { onClick: () => setLoop(!loop), title: t("ctrl.loop"), active: loop, children: _jsxs("svg", { width: "12", height: "12", viewBox: "0 0 12 12", children: [_jsx("path", { d: "M3 3h5a2.5 2.5 0 010 5H3", stroke: "currentColor", strokeWidth: "1.5", fill: "none" }), _jsx("path", { d: "M5 1L3 3l2 2", stroke: "currentColor", strokeWidth: "1.5", fill: "none" })] }) }), _jsx("div", { className: "w-px h-4 bg-slate-700 mx-0.5" }), _jsxs("span", { className: "text-xs font-mono text-sky-400 w-20 text-right tabular-nums", children: [currentTime.toFixed(2), " s"] }), _jsx("div", { className: "flex gap-0.5 ml-1", children: SPEEDS.map((s) => (_jsx("button", { onClick: () => setSpeed(s.value), className: `px-1.5 py-0.5 rounded text-[10px] font-medium transition-all ${timeScale === s.value
                                ? "bg-sky-600 text-white shadow-sm"
                                : "text-slate-500 hover:text-slate-300 hover:bg-slate-800"}`, children: s.label }, s.value))) }), _jsx("div", { className: "flex-1" }), _jsxs("span", { className: "text-[10px] text-slate-600", children: [totalDuration.toFixed(1), " s"] })] }), _jsxs("div", { className: "h-9 flex items-center relative mx-4", ref: barRef, onClick: handleBarClick, onWheel: handleWheel, children: [_jsx("div", { className: "absolute left-0 right-0 h-1.5 rounded-full bg-slate-800 cursor-pointer", style: { top: 4 } }), PHASES.map((p) => {
                        const leftPct = (p.timeRange[0] / totalDuration) * 100;
                        const wPct = ((p.timeRange[1] - p.timeRange[0]) / totalDuration) * 100;
                        return (_jsx("div", { className: "absolute h-1.5 pointer-events-none opacity-40", style: {
                                left: `${leftPct}%`,
                                width: `${wPct}%`,
                                top: 4,
                                borderRadius: "999px",
                                backgroundColor: PHASE_COLORS[p.id],
                            } }, `seg-${p.id}`));
                    }), _jsx("div", { className: "absolute left-0 h-1.5 rounded-full pointer-events-none", style: {
                            width: `${progress}%`,
                            top: 4,
                            background: "linear-gradient(90deg, rgba(56,189,248,0.6), rgba(56,189,248,0.3))",
                        } }), PHASES.map((p) => {
                        const leftPct = (p.timeRange[0] / totalDuration) * 100;
                        const isActive = currentPhase === p.id;
                        const thisIdx = PHASES.findIndex((ph) => ph.id === p.id);
                        const isPast = phaseIdx > thisIdx;
                        const isCurrentOrPast = phaseIdx >= thisIdx;
                        const color = PHASE_COLORS[p.id];
                        return (_jsxs("button", { onClick: (e) => {
                                e.stopPropagation();
                                jumpToPhase(p.id);
                            }, className: "absolute -translate-x-1/2 group", style: { left: `${leftPct}%`, top: 0 }, title: t(p.label) + ": " + p.timeRange[0].toFixed(1) + "s - " + p.timeRange[1].toFixed(1) + "s", children: [_jsx("div", { className: "rounded-full transition-all duration-200", style: {
                                        width: isActive ? 14 : 10,
                                        height: isActive ? 14 : 10,
                                        marginTop: isActive ? 0 : 2,
                                        backgroundColor: isCurrentOrPast ? color : "#334155",
                                        border: isActive
                                            ? "2px solid white"
                                            : isPast
                                                ? "2px solid " + color
                                                : "2px solid #475569",
                                        boxShadow: isActive ? "0 0 8px " + color : "none",
                                    } }), _jsx("span", { className: `absolute top-full mt-1 left-1/2 -translate-x-1/2 text-[9px] whitespace-nowrap transition-all duration-200 ${isActive
                                        ? "text-white font-medium opacity-100"
                                        : isPast
                                            ? "text-slate-400 opacity-80"
                                            : "text-slate-600 opacity-0 group-hover:opacity-60"}`, children: t(p.label) })] }, `node-${p.id}`));
                    }), _jsxs("div", { className: "absolute top-[-2px] -translate-x-1/2 z-10", style: { left: `${progress}%` }, children: [_jsx("div", { className: "w-0.5 h-5 bg-sky-400 rounded-full shadow-sm shadow-sky-500/30" }), _jsx("div", { onMouseDown: handleThumbMouseDown, className: "w-3.5 h-3.5 bg-sky-400 rounded-full cursor-grab active:cursor-grabbing -ml-[5px] shadow-md shadow-sky-900/50 border border-sky-200" })] }), ticks.map((tick) => {
                        const leftPct = (tick / totalDuration) * 100;
                        const isMajor = tick % 1 === 0;
                        return (_jsxs("div", { className: "absolute pointer-events-none", style: { left: `${leftPct}%`, bottom: 0 }, children: [_jsx("div", { className: `-translate-x-1/2 ${isMajor ? "h-2 w-px bg-slate-600" : "h-1 w-px bg-slate-700"}` }), isMajor && (_jsxs("span", { className: "absolute top-0.5 -translate-x-1/2 text-[8px] text-slate-600 tabular-nums", children: [tick, "s"] }))] }, `tick-${tick}`));
                    })] })] }));
}
//# sourceMappingURL=Timeline.js.map