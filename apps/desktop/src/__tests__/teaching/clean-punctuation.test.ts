import { describe, it, expect } from "vitest";
import { cleanTrailingPunctuation } from "../../renderer/lib/teaching-script-ai";

describe("cleanTrailingPunctuation (S80 optional micro-fix)", () => {
  it("strips trailing incomplete punctuation", () => {
    expect(cleanTrailingPunctuation("小球落地,")).toBe("小球落地");
    expect(cleanTrailingPunctuation("注意……")).toBe("注意");
    expect(cleanTrailingPunctuation("观察电流通过电子流时的变化")).toBe("观察电流通过电子流时的变化");
    expect(cleanTrailingPunctuation("速度减小，")).toBe("速度减小");
  });

  it("keeps meaningful terminal punctuation", () => {
    expect(cleanTrailingPunctuation("小球落地。")).toBe("小球落地。");
    expect(cleanTrailingPunctuation("为什么？")).toBe("为什么？");
  });
});
