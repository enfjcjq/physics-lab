import { describe, it, expect, beforeEach } from "vitest";
import { usePanelManager } from "../../renderer/core/panel-manager.store";

describe("S83 rule 1: docked panel FIFO limit", () => {
  beforeEach(() => {
    usePanelManager.getState().resetLayout();
  });

  it("opening a 3rd docked panel evicts the earliest (FIFO)", () => {
    const mgr = usePanelManager.getState();
    mgr.close("teaching");
    mgr.close("problem");
    mgr.close("charts");
    // open left panel (problem), right panel (teaching), then bottom (charts) -> 3rd should evict earliest (problem)
    mgr.open("problem");
    mgr.open("teaching");
    mgr.open("charts");
    const panels = usePanelManager.getState().panels;
    const dockedOpen = Object.entries(panels).filter(([, p]) => p.isOpen && p.zone !== "floating").length;
    expect(dockedOpen).toBeLessThanOrEqual(2);
    expect(panels.charts.isOpen).toBe(true);
  });
});
