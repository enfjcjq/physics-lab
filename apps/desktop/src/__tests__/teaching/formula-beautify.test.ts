import { describe, it, expect } from "vitest";
import { beautifyFormula } from "../../renderer/features/experiment/components/teaching/formula-beautify";

describe("beautifyFormula (S83 rule 4)", () => {
  it("converts the acceptance sample", () => {
    const out = beautifyFormula("y(t)=v0*sin(theta)*t-(1/2)*g*t^2");
    expect(out).toContain("v₀");
    expect(out).toContain("sin");
    expect(out).toContain("θ");
    expect(out).toContain("½");
    expect(out).toContain("t²");
  });
  it("turns exponents and Greek names", () => {
    expect(beautifyFormula("x = r * cos(omega * t)")).toContain("ω");
    expect(beautifyFormula("v^2 = 2*g*h0")).toContain("v²");
    expect(beautifyFormula("v^2 = 2*g*h0")).toContain("h₀");
  });
  it("uses middle dot for multiplication and minus sign", () => {
    expect(beautifyFormula("F = m*a")).toContain("m·a");
    expect(beautifyFormula("a - b")).toContain("−");
  });
});