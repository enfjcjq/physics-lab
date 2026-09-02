import { describe, it, expect } from "vitest";
import { computeBounds, fitToViewport, projectMany, type Viewport } from "../../renderer/features/experiment/components/scene2d/scene2d-data";

const viewport: Viewport = { width: 800, height: 600, padding: 40 };

describe("scene2d-data (S88-A)", () => {
  it("computes inclusive bounds", () => {
    const b = computeBounds([{ x: 0, y: 10 }, { x: 3, y: 0.2 }]);
    expect(b.minX).toBe(0);
    expect(b.maxX).toBe(3);
    expect(b.minY).toBe(0.2);
    expect(b.maxY).toBe(10);
  });

  it("keeps a full free-fall path inside the viewport", () => {
    const points = [];
    for (let y = 0.2; y <= 10; y += 0.2) points.push({ x: 0, y });
    const out = projectMany(points, viewport);
    for (const p of out) {
      expect(p.x).toBeGreaterThanOrEqual(0);
      expect(p.x).toBeLessThanOrEqual(viewport.width);
      expect(p.y).toBeGreaterThanOrEqual(0);
      expect(p.y).toBeLessThanOrEqual(viewport.height);
    }
    // top of path (y=10) maps above bottom of path (y=0.2) in screen space
    expect(out[out.length - 1].y).toBeLessThan(out[0].y);
  });

  it("is deterministic", () => {
    const points = [{ x: 1, y: 2 }, { x: 3, y: 4 }, { x: 5, y: 0 }];
    expect(projectMany(points, viewport)).toEqual(projectMany(points, viewport));
  });

  it("scale is finite and positive", () => {
    const b = computeBounds([{ x: 0, y: 0 }, { x: 10, y: 10 }]);
    const fit = fitToViewport(b, viewport);
    expect(fit.scale).toBeGreaterThan(0);
    expect(Number.isFinite(fit.scale)).toBe(true);
  });
});
