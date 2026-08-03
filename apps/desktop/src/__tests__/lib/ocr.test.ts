import { describe, it, expect } from "vitest";
import { toGrayscale, otsuThreshold, binarize } from "../../renderer/lib/ocr";

/** Build an RGBA pixel buffer from gray values (alpha=255). */
function grayPixels(values: number[]): Uint8ClampedArray {
  const data = new Uint8ClampedArray(values.length * 4);
  values.forEach((v, i) => {
    data[i * 4] = data[i * 4 + 1] = data[i * 4 + 2] = v;
    data[i * 4 + 3] = 255;
  });
  return data;
}

describe("ocr preprocessing (pure core)", () => {
  it("toGrayscale applies luma weights (green matters most)", () => {
    // Pure green pixel: gray should be 0.587 * 255 ≈ 150
    const data = new Uint8ClampedArray([0, 255, 0, 255]);
    toGrayscale(data);
    expect(data[0]).toBe(150);
    expect(data[0]).toBe(data[1]);
    expect(data[1]).toBe(data[2]);
    // Alpha untouched
    expect(data[3]).toBe(255);
  });

  it("binarize maps dark to 0 and bright to 255", () => {
    const data = grayPixels([100, 200]);
    binarize(data, 128);
    expect(data[0]).toBe(0);
    expect(data[4]).toBe(255);
  });

  it("otsuThreshold separates dark ink from bright paper", () => {
    // Simulated page: mostly bright paper (220) with some dark ink (30)
    const values = [
      ...Array(800).fill(220),
      ...Array(200).fill(30),
    ];
    const data = grayPixels(values);
    const t = otsuThreshold(data);
    expect(t).toBeGreaterThanOrEqual(30);
    expect(t).toBeLessThan(220);
  });

  it("full pipeline: ink pixels become black, paper becomes white", () => {
    const values = [...Array(80).fill(215), ...Array(20).fill(40)];
    const data = grayPixels(values);
    toGrayscale(data);
    binarize(data, otsuThreshold(data));
    expect(data[0]).toBe(255); // paper
    expect(data[80 * 4]).toBe(0); // ink
  });
});
