import { useRef, useCallback, useEffect, useState, useMemo } from "react";
import { usePanelManager } from "../../core/panel-manager.store";
import { useUIStore } from "../../stores/ui.store";
import type { ChartTab } from "../../stores/ui.store";
import { useSimulation, type CachedFrame } from "../../features/experiment/experiment.store";
import { useI18n } from "../../core/i18n";
import { DataPanel } from "./DataPanel";

const CHART_TABS: { id: ChartTab; labelKey: string }[] = [
  { id: "position_time", labelKey: "chart.s_t" },
  { id: "velocity_time", labelKey: "chart.v_t" },
  { id: "acceleration_time", labelKey: "chart.a_t" },
  { id: "kinetic_energy", labelKey: "chart.ke" },
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
  const frameCache = useSimulation((s) => s.frameCache);
  const currentTime = useSimulation((s) => s.currentTime);
  const { t } = useI18n();

  const isDragging = useRef(false);
  const startY = useRef(0);
  const startHeight = useRef(0);

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    isDragging.current = true;
    startY.current = e.clientY;
    startHeight.current = drawerHeight;
    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
  }, [drawerHeight]);

  const onMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging.current) return;
    const delta = startY.current - e.clientY;
    const maxH = Math.max(150, Math.floor(window.innerHeight * 0.35));
    const newH = Math.max(150, Math.min(maxH, startHeight.current + delta));
    setDrawerHeight(newH);
  }, [setDrawerHeight]);

  const onMouseUp = useCallback(() => {
    isDragging.current = false;
    document.removeEventListener("mousemove", onMouseMove);
    document.removeEventListener("mouseup", onMouseUp);
  }, [onMouseMove]);

  return (
    <div className="flex-shrink-0 border-t border-slate-800 bg-slate-900/95 transition-all duration-300"
         style={{ height: drawerOpen ? `${drawerHeight}px` : "0px", overflow: "hidden" }}>
      <div onMouseDown={onMouseDown}
        className="h-1.5 bg-slate-800 hover:bg-sky-700 cursor-ns-resize transition-colors
          flex items-center justify-center group">
        <div className="w-8 h-0.5 rounded-full bg-slate-600 group-hover:bg-sky-400 transition-colors" />
      </div>
      <div className="flex items-center px-4 py-1.5 gap-1">
        <button onClick={() => setTab("data" as any)}
          className={`px-3 py-1 rounded-md text-xs transition-all ${
            (activeTab as string) === "data"
              ? "bg-sky-600/20 text-sky-400 border border-sky-600/30"
              : "text-slate-500 hover:text-slate-300"
          }`}>
          Data
        </button>
        {CHART_TABS.map((tab) => (
          <button key={tab.id} onClick={() => setTab(tab.id)}
            className={`px-3 py-1 rounded-md text-xs transition-all ${
              activeTab === tab.id
                ? "bg-sky-600/20 text-sky-400 border border-sky-600/30"
                : "text-slate-500 hover:text-slate-300"
            }`}>
            {t(tab.labelKey)}
          </button>
        ))}
        <div className="flex-1" />
        <button onClick={toggleDrawer} className="px-2 py-1 text-xs text-slate-500 hover:text-slate-300">
          {drawerOpen ? "▾" : "▴"}
        </button>
      </div>
      <div className="px-4 pb-3" style={{ height: "calc(100% - 44px)" }}>
        {(activeTab as string) === "data"
          ? <DataPanel />
          : <CanvasChart activeTab={activeTab as ChartTab} frameCache={frameCache} mass={mass} gravity={gravity} height={height} currentTime={currentTime} />
        }
      </div>
    </div>
  );
}

// ========== Canvas Chart ==========

interface ChartData {
  time: number;
  y: number;
  s: number;
  v: number;
  a: number;
  ke: number;
  pe: number;
  me: number;
}

function deriveData(frameCache: CachedFrame[], mass: number, gravity: number, height: number): ChartData[] {
  return frameCache.filter((_, i) => i % 3 === 0).map((f) => {
    const y = f.ballY;
    const s = height - y;
    const v = f.ballVelocity;
    const a = f.ballAcceleration;
    const ke = 0.5 * mass * v * v;
    const pe = mass * gravity * y;
    return { time: f.time, y, s, v, a, ke, pe, me: ke + pe };
  });
}

const COLORS = {
  bg: "#0f172a",
  grid: "#1e293b",
  axis: "#475569",
  text: "#64748b",
  hover: "#334155",
  playhead: "#38bdf8",
  tooltip: { bg: "#1e293b", border: "#334155", text: "#e2e8f0" },
};

const PLOT_COLORS: Record<string, string> = {
  s: "#22c55e", v: "#f59e0b", a: "#ef4444", ke: "#f59e0b", pe: "#22c55e", me: "#3b82f6",
};

function CanvasChart({ activeTab, frameCache, mass, gravity, height, currentTime }: {
  activeTab: ChartTab; frameCache: CachedFrame[]; mass: number; gravity: number; height: number; currentTime: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [tooltip, setTooltip] = useState<{ x: number; y: number; text: string[] } | null>(null);
  const [dimensions, setDimensions] = useState({ w: 600, h: 140 });

  const data = useMemo(() => deriveData(frameCache, mass, gravity, height), [frameCache, mass, gravity, height]);

  // Resize observer
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height: h } = entry.contentRect;
        setDimensions({ w: Math.floor(width), h: Math.floor(h) });
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Draw
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = dimensions.w * dpr;
    canvas.height = dimensions.h * dpr;
    ctx.scale(dpr, dpr);

    const pad = { top: 15, right: 15, bottom: 22, left: 50 };
    const pw = dimensions.w - pad.left - pad.right;
    const ph = dimensions.h - pad.top - pad.bottom;

    // Clear
    ctx.fillStyle = COLORS.bg;
    ctx.fillRect(0, 0, dimensions.w, dimensions.h);

    if (data.length < 2) return;

    // Grid (S86 M5: low emphasis)
    ctx.globalAlpha = 0.15;
    ctx.strokeStyle = COLORS.grid;
    ctx.lineWidth = 0.5;
    for (let i = 0; i <= 4; i++) {
      const y = pad.top + (i / 4) * ph;
      ctx.beginPath();
      ctx.moveTo(pad.left, y);
      ctx.lineTo(pad.left + pw, y);
      ctx.stroke();
    }
    for (let i = 0; i <= 6; i++) {
      const x = pad.left + (i / 6) * pw;
      ctx.beginPath();
      ctx.moveTo(x, pad.top);
      ctx.lineTo(x, pad.top + ph);
      ctx.stroke();
    }

    // Axes (S86 M5: low emphasis)
    ctx.globalAlpha = 0.2;
    ctx.strokeStyle = COLORS.axis;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(pad.left, pad.top);
    ctx.lineTo(pad.left, pad.top + ph);
    ctx.lineTo(pad.left + pw, pad.top + ph);
    ctx.stroke();

    ctx.globalAlpha = 1;

    // Determine which values to plot
    type PlotKey = "s" | "v" | "a" | "ke" | "pe" | "me";
    let keys: PlotKey[];
    let yMax: number;
    switch (activeTab) {
      case "position_time": keys = ["s"]; yMax = height * 1.1; break;
      case "velocity_time": keys = ["v"]; yMax = gravity * 2.5; break;
      case "acceleration_time": keys = ["a"]; yMax = gravity * 1.5; break;
      case "kinetic_energy":
        keys = ["ke", "pe", "me"];
        yMax = mass * gravity * height * 1.1;
        break;
      default: keys = ["s"]; yMax = height;
    }

    const yMin = activeTab === "velocity_time" ? -yMax : 0;

    // Draw lines
    for (const key of keys) {
      const color = PLOT_COLORS[key] || "#fff";
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.5;
      if (key === "pe") ctx.setLineDash([4, 2]);
      else ctx.setLineDash([]);

      ctx.beginPath();
      let firstPoint = true;
      for (let i = 0; i < data.length; i++) {
        const val = data[i][key] as number;
        const px = pad.left + (i / Math.max(data.length - 1, 1)) * pw;
        const py = pad.top + ph - ((val - yMin) / (yMax - yMin)) * ph;
        const clampedY = Math.max(pad.top, Math.min(pad.top + ph, py));
        if (firstPoint) { ctx.moveTo(px, clampedY); firstPoint = false; }
        else ctx.lineTo(px, clampedY);
      }
      ctx.stroke();
    }
    ctx.setLineDash([]);

    // Playhead
    if (currentTime > 0) {
      const totalTime = data.length > 0 ? data[data.length - 1].time : 0;
      const px = totalTime > 0 ? pad.left + (currentTime / totalTime) * pw : pad.left;
      ctx.strokeStyle = COLORS.playhead;
      ctx.lineWidth = 1;
      ctx.setLineDash([2, 2]);
      ctx.beginPath();
      ctx.moveTo(px, pad.top);
      ctx.lineTo(px, pad.top + ph);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Y-axis labels
    ctx.fillStyle = COLORS.text;
    ctx.font = "9px monospace";
    ctx.textAlign = "right";
    for (let i = 0; i <= 3; i++) {
      const val = yMin + (i / 3) * (yMax - yMin);
      const y = pad.top + ph - (i / 3) * ph;
      ctx.fillText(val.toFixed(1), pad.left - 6, y + 3);
    }

    // Legend for energy chart
    if (activeTab === "kinetic_energy") {
      const legend = [
        { label: "KE", color: PLOT_COLORS.ke },
        { label: "PE", color: PLOT_COLORS.pe },
        { label: "ME", color: PLOT_COLORS.me },
      ];
      ctx.textAlign = "left";
      legend.forEach((item, i) => {
        const lx = pad.left + i * 60;
        ctx.fillStyle = item.color;
        ctx.fillRect(lx, 6, 10, 2);
        ctx.fillStyle = COLORS.text;
        ctx.fillText(item.label, lx + 14, 10);
      });
    }
  }, [data, activeTab, currentTime, dimensions]);

  // Mouse hover for tooltip
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (data.length < 2) return;
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const mx = e.clientX - rect.left;
    const pad = { left: 50, right: 15 };
    const pw = dimensions.w - pad.left - pad.right;
    const ratio = (mx - pad.left) / pw;
    if (ratio < 0 || ratio > 1) { setTooltip(null); return; }
    const idx = Math.round(ratio * (data.length - 1));
    const d = data[idx];
    if (!d) { setTooltip(null); return; }
    setTooltip({
      x: mx + 10,
      y: e.clientY - rect.top - 30,
      text: [
        `t = ${d.time.toFixed(2)} s`,
        activeTab === "position_time" ? `s = ${d.s.toFixed(1)} m` :
        activeTab === "velocity_time" ? `v = ${d.v.toFixed(1)} m/s` :
        activeTab === "acceleration_time" ? `a = ${d.a.toFixed(1)} m/s²` :
        `KE=${d.ke.toFixed(1)} PE=${d.pe.toFixed(1)} ME=${d.me.toFixed(1)}`
      ],
    });
  }, [data, activeTab, dimensions]);

  const handleMouseLeave = () => setTooltip(null);

  return (
    <div ref={containerRef} className="w-full h-full relative" onMouseMove={handleMouseMove} onMouseLeave={handleMouseLeave}>
      <canvas ref={canvasRef} className="w-full h-full" style={{ display: "block" }} />
      {tooltip && (
        <div className="absolute pointer-events-none z-10 px-2 py-1 rounded text-[10px] font-mono"
          style={{
            left: tooltip.x, top: tooltip.y,
            background: COLORS.tooltip.bg, border: `1px solid ${COLORS.tooltip.border}`,
            color: COLORS.tooltip.text,
          }}>
          {tooltip.text.map((line, i) => <div key={i}>{line}</div>)}
        </div>
      )}
    </div>
  );
}
