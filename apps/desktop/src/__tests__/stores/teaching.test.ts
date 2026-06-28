import { describe, it, expect, beforeEach } from "vitest";
import { useTeaching } from "../../renderer/core/teaching.store";

describe("Teaching Store", () => {
  beforeEach(() => {
    useTeaching.setState({
      mode: "learning",
      subMode: "teaching",
      overlay: {
        showKnowledge: true, showForces: true, showMotion: true,
        showDerivation: false, showTips: true, showAnswer: false, showFormulas: false,
      },
    });
  });

  it("should start in learning mode", () => {
    expect(useTeaching.getState().mode).toBe("learning");
  });

  it("should switch to experiment mode", () => {
    useTeaching.getState().setMode("experiment");
    expect(useTeaching.getState().mode).toBe("experiment");
  });

  it("should switch to analysis mode", () => {
    useTeaching.getState().setMode("analysis");
    expect(useTeaching.getState().mode).toBe("analysis");
  });

  it("should toggle overlay visibility", () => {
    const { toggleOverlay, getVisibleOverlays } = useTeaching.getState();
    const before = getVisibleOverlays().length;
    toggleOverlay("showKnowledge");
    const after = getVisibleOverlays().length;
    expect(after).not.toBe(before);
  });

  it("should have correct overlay presets per submode", () => {
    useTeaching.getState().setSubMode("experiment");
    const overlays = useTeaching.getState().getVisibleOverlays();
    expect(overlays.length).toBe(0); // Experiment shows nothing by default

    useTeaching.getState().setSubMode("solving");
    const solvingOverlays = useTeaching.getState().getVisibleOverlays();
    expect(solvingOverlays.length).toBeGreaterThan(0);
  });
});
