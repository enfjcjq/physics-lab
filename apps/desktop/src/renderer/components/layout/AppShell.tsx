import { MenuBar } from "./MenuBar";
import { Timeline } from "../timeline/Timeline";
import { usePanelManager } from "../../core/panel-manager.store";
import { LeftPanel } from "../panels/LeftPanel";
import { RightPanel } from "../panels/RightPanel";
import { CenterPanel } from "../panels/CenterPanel";
import { BottomDrawer } from "../panels/BottomDrawer";

export function AppShell() {
  const panels = usePanelManager((s) => s.panels);

  const leftOpen = panels.problem?.isOpen || panels.history?.isOpen || panels.parameters?.isOpen;
  const rightOpen = panels.analysis?.isOpen || panels.teaching?.isOpen || panels.properties?.isOpen;
  const bottomOpen = panels.timeline?.isOpen || panels.charts?.isOpen;

  return (
    <div className="w-full h-full flex flex-col" style={{ background: "var(--bg-root)" }}>
      <MenuBar />
      <div className="flex-1 flex min-h-0">
        {leftOpen && (
          <div className="flex-shrink-0 border-r flex flex-col"
               style={{ width: 280, borderColor: "var(--border-primary)", background: "var(--bg-primary)" }}>
            {panels.problem?.isOpen && <LeftPanel />}
          </div>
        )}
        <CenterPanel />
        {rightOpen && (
          <div className="flex-shrink-0 border-l flex flex-col"
               style={{ width: 340, borderColor: "var(--border-primary)", background: "var(--bg-primary)" }}>
            {panels.analysis?.isOpen && <RightPanel />}
          </div>
        )}
      </div>
      {bottomOpen && <BottomDrawer />}
      <Timeline />
    </div>
  );
}
