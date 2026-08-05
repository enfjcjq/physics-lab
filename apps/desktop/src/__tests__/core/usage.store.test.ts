import { describe, it, expect, beforeEach } from "vitest";
import { useUsage } from "../../renderer/core/usage.store";

describe("usage telemetry (S77)", () => {
  beforeEach(() => {
    useUsage.getState().reset();
    // jsdom lacks URL.createObjectURL; stub for the export test.
    (globalThis as Record<string, unknown>).URL = {
      createObjectURL: () => "blob:mock",
      revokeObjectURL: () => {},
    };
  });

  it("counts IconRail clicks per icon and persists", () => {
    useUsage.getState().incrementIcon("teaching");
    useUsage.getState().incrementIcon("teaching");
    useUsage.getState().incrementIcon("charts");
    const s = useUsage.getState().snapshot();
    expect(s.iconClicks.teaching).toBe(2);
    expect(s.iconClicks.charts).toBe(1);
  });

  it("counts core-path clicks", () => {
    useUsage.getState().incrementCorePath();
    useUsage.getState().incrementCorePath();
    expect(useUsage.getState().snapshot().corePathClicks).toBe(2);
  });

  it("exportData does not throw (jsdom download)", () => {
    expect(() => useUsage.getState().exportData()).not.toThrow();
  });
});
