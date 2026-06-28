import { describe, it, expect } from "vitest";

describe("smoke test", () => {
  it("should pass basic assertion", () => {
    expect(1 + 1).toBe(2);
  });

  it("jsdom environment should be available", () => {
    expect(typeof document).toBe("object");
    expect(typeof window).toBe("object");
  });
});
