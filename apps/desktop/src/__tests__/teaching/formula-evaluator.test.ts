import { describe, it, expect } from "vitest";
import { evaluateExpression, normalizeExpression } from "../../renderer/features/experiment/components/teaching/formula-evaluator";

describe("formula evaluator", () => {
  it("evaluates basic arithmetic", () => {
    expect(evaluateExpression("1 + 2")).toBe(3);
    expect(evaluateExpression("2 * 3 + 4")).toBe(10);
    expect(evaluateExpression("(1 + 2) * 3")).toBe(9);
    expect(evaluateExpression("10 - 4 / 2")).toBe(8);
  });

  it("handles exponentiation (right-associative)", () => {
    expect(evaluateExpression("2 ^ 3")).toBe(8);
    expect(evaluateExpression("2 ^ 3 ^ 2")).toBe(512);
    expect(evaluateExpression("3^2")).toBe(9);
  });

  it("handles unary minus", () => {
    expect(evaluateExpression("-3 + 5")).toBe(2);
    expect(evaluateExpression("2 * -3")).toBe(-6);
  });

  it("handles functions and constants", () => {
    expect(evaluateExpression("sqrt(16)")).toBe(4);
    expect(evaluateExpression("abs(-5)")).toBe(5);
    expect(evaluateExpression("sqrt(2 * 9.8 * 10)")).toBeCloseTo(14, 6);
    expect(evaluateExpression("2 * PI")).toBeCloseTo(2 * Math.PI, 6);
  });

  it("normalizes equations and symbols", () => {
    expect(normalizeExpression("v = sqrt(2*g*h0)").startsWith("sqrt")).toBe(true);
    expect(evaluateExpression("v = 3 + 4")).toBe(7);
    expect(evaluateExpression("y(t) = 10 - 0.5 * 9.8 * 1^2")).toBeCloseTo(5.1, 6);
  });

  it("returns null for invalid or undefined input", () => {
    expect(evaluateExpression("1 / 0")).toBeNull();
    expect(evaluateExpression("garbage(")).toBeNull();
    expect(evaluateExpression("sin")).toBeNull();
    expect(evaluateExpression("")).toBeNull();
    expect(evaluateExpression("1 +")).toBeNull();
  });
});
