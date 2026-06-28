import { describe, it, expect, beforeEach } from "vitest";
import { useDashboard } from "../../renderer/core/dashboard.store";

describe("Dashboard Store", () => {
  beforeEach(() => {
    useDashboard.getState().closeDashboard();
  });

  it("should start closed", () => {
    expect(useDashboard.getState().open).toBe(false);
  });

  it("should toggle open state", () => {
    useDashboard.getState().toggle();
    expect(useDashboard.getState().open).toBe(true);
    useDashboard.getState().toggle();
    expect(useDashboard.getState().open).toBe(false);
  });

  it("should open and close explicitly", () => {
    useDashboard.getState().openDashboard();
    expect(useDashboard.getState().open).toBe(true);
    useDashboard.getState().closeDashboard();
    expect(useDashboard.getState().open).toBe(false);
  });
});