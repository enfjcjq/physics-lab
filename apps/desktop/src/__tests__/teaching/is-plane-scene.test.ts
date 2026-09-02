import { describe, it, expect } from "vitest";
import { isPlaneScene } from "../../renderer/features/experiment/components/scene2d/is-plane-scene";

describe("isPlaneScene (S88-B1)", () => {
  it("marks plane experiments as 2D-first", () => {
    for (const id of ["free-fall", "projectile-motion", "inclined-plane", "collision", "spring-mass", "pendulum", "circular-motion", "ohms_law", "transverse_wave"]) {
      expect(isPlaneScene(id)).toBe(true);
    }
  });

  it("keeps spatial experiments 3D-first", () => {
    for (const id of ["electric_motor", "ac_generator", "faraday_law", "coulombs_law", "refraction", "lens_optics"]) {
      expect(isPlaneScene(id)).toBe(false);
    }
  });
});
