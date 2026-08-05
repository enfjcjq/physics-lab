import { MenuBar } from "./MenuBar";
import { pluginRegistry } from "../../core/plugin-registry";
import { useSimulation } from "../../features/experiment/experiment.store";
import { Timeline } from "../timeline/Timeline";
import { usePanelManager } from "../../core/panel-manager.store";
import { useTeaching } from "../../core/teaching.store";
import { useI18n } from "../../core/i18n";
import { useUsage } from "../../core/usage.store";
import { LeftPanel } from "../panels/LeftPanel";
import { RightPanel } from "../panels/RightPanel";
import { CenterPanel } from "../panels/CenterPanel";
import { BottomDrawer } from "../panels/BottomDrawer";
import { TeacherPanel } from "../teaching/TeacherPanel";
import { WelcomeScreen } from "./WelcomeScreen";
import { LearningDashboard } from "../dashboard/LearningDashboard";
import { useDashboard } from "../../core/dashboard.store";
import { ToastContainer } from "./ToastContainer";
import { useAchievements } from "../../core/achievements.store";
import { useToasts } from "../../core/toast.store";
import { useEffect, useRef } from "react";

/**
 * P2 first step (S72): learning scene page default = canvas + Timeline +
 * TeacherPanel. Other panels open via the left edge icon rail (parameters /
 * charts / teacher steps / knowledge graph). The 3-mode switcher and the
 * top-bar experiment switcher are removed; original features stay reachable
 * (MenuBar keeps everything; experiment library lives in the canvas drawer).
 */
function IconRail() {
  const { t } = useI18n();
  const panels = usePanelManager((s) => s.panels);
  const toggle = usePanelManager((s) => s.toggle);
  const items = [
    { id: "problem", icon: "\u2699\uFE0F", key: "rail.parameters" },
    { id: "charts", icon: "\uD83D\uDCCA", key: "rail.charts" },
    { id: "teaching", icon: "\uD83D\uDCD6", key: "rail.steps" },
    { id: "analysis", icon: "\uD83D\uDD2D", key: "rail.graph" },
  ] as const;
  return (
    <div className="flex-shrink-0 w-12 border-r flex flex-col items-center py-2 gap-1.5"
      style={{ borderColor: "var(--border-primary)", background: "var(--bg-primary)" }}>
      {items.map((it) => {
        const open = panels[it.id]?.isOpen ?? false;
        return (
          <button key={it.id} title={t(it.key)} onClick={() => toggle(it.id)}
            className={"w-9 h-9 rounded-lg flex items-center justify-center text-base transition-all duration-200 " +
              (open ? "bg-orange-600/15 text-orange-400 ring-1 ring-orange-500/40" : "text-slate-500 hover:text-slate-200 hover:bg-slate-800/60")}>
            <span>{it.icon}</span>
          </button>
        );
      })}
    </div>
  );
}

export function AppShell() {
  const panels = usePanelManager((s) => s.panels);
  const { t } = useI18n();
  const { open: showDashboard, closeDashboard } = useDashboard();
  const { badges } = useAchievements();
  const prevBadgeCount = useRef(0);

  // Toast when new achievement unlocks
  useEffect(function() {
    const unlocked = badges.filter(function(b) { return b.unlocked; });
    if (unlocked.length > prevBadgeCount.current && prevBadgeCount.current > 0) {
      const newest = unlocked[unlocked.length - 1];
      useToasts.getState().show({ title: newest.title, message: newest.description, icon: newest.icon });
    }
    prevBadgeCount.current = unlocked.length;
  }, [badges]);

  const showLeft = panels.problem?.isOpen ?? false;
  const showTeacher = panels.teaching?.isOpen ?? false;
  const showRight = panels.analysis?.isOpen ?? false;
  const showBottom = panels.charts?.isOpen ?? false;

  return (
    <div className="w-full h-full flex flex-col relative" style={{ background: "var(--bg-root)" }}>
      <WelcomeScreen />
      <MenuBar />

      <div className="flex-1 flex min-h-0">
        <IconRail />

        {showLeft && (
          <div className="flex-shrink-0 border-r flex flex-col transition-all duration-500 ease-in-out"
            style={{ width: 280, borderColor: "var(--border-primary)", background: "var(--bg-primary)" }}>
            <div className="animate-in fade-in slide-in-from-left duration-300">
              <LeftPanel />
            </div>
          </div>
        )}

        <CenterPanel />

        {showTeacher && (
          <div className="flex-shrink-0 border-l flex flex-col transition-all duration-500 ease-in-out"
            style={{ width: 320, borderColor: "var(--border-primary)", background: "var(--bg-primary)" }}>
            <div className="animate-in fade-in slide-in-from-right duration-300">
              <TeacherPanel />
            </div>
          </div>
        )}

        {showRight && (
          <div className="flex-shrink-0 border-l flex flex-col"
            style={{ width: 340, borderColor: "var(--border-primary)", background: "var(--bg-primary)" }}>
            <RightPanel />
          </div>
        )}
      </div>

      {showBottom && <BottomDrawer />}
      <Timeline />

      <ToastContainer />
      {showDashboard && (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={closeDashboard}>
          <div className="w-[420px] max-h-[80vh] rounded-2xl shadow-2xl border border-slate-700 overflow-hidden animate-in zoom-in-95 duration-200"
            style={{ background: "var(--bg-primary)" }}
            onClick={(e) => e.stopPropagation()}>
            <LearningDashboard />
          </div>
        </div>
      )}
    </div>
  );
}
