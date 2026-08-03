import { createWorker } from "tesseract.js";

// ============================================================
// OCR engine wrapper: image preprocessing + text recognition.
//
// Structure follows the "pure core + thin shell" pattern:
//   - Pure pixel functions (toGrayscale / otsuThreshold / binarize)
//     have no browser dependencies -> unit-testable in vitest.
//   - Canvas / Tesseract code is a thin shell around them.
// ============================================================

export interface OcrProgress {
  status: string;
  progress: number; // 0..1
}

// ---------- Pure core (unit-testable) ----------

/** Convert RGBA pixels to grayscale in place. Data layout: [r,g,b,a, r,g,b,a, ...] */
export function toGrayscale(data: Uint8ClampedArray): void {
  for (let i = 0; i < data.length; i += 4) {
    // ITU-R BT.601 luma weights: human eye is most sensitive to green
    const g = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    data[i] = data[i + 1] = data[i + 2] = g;
  }
}

/**
 * Otsu's method: automatically pick the threshold that best separates
 * "paper" (bright) from "ink" (dark) by maximizing between-class variance.
 * Input: grayscale RGBA pixels. Returns threshold in [0, 255].
 */
export function otsuThreshold(data: Uint8ClampedArray): number {
  const hist = new Array<number>(256).fill(0);
  const total = data.length / 4;
  for (let i = 0; i < data.length; i += 4) hist[data[i]]++;

  let sumAll = 0;
  for (let i = 0; i < 256; i++) sumAll += i * hist[i];

  let sumB = 0, wB = 0, best = -1, bestT = 127;
  for (let t = 0; t < 256; t++) {
    wB += hist[t];
    if (wB === 0) continue;
    const wF = total - wB;
    if (wF === 0) break;
    sumB += t * hist[t];
    const mB = sumB / wB;
    const mF = (sumAll - sumB) / wF;
    const between = wB * wF * (mB - mF) * (mB - mF);
    if (between > best) { best = between; bestT = t; }
  }
  return bestT;
}

/** Binarize grayscale RGBA pixels in place: ink -> black (0), paper -> white (255). */
export function binarize(data: Uint8ClampedArray, threshold: number): void {
  for (let i = 0; i < data.length; i += 4) {
    // Strictly greater: pixels at exactly the Otsu threshold are treated as ink
    const v = data[i] > threshold ? 255 : 0;
    data[i] = data[i + 1] = data[i + 2] = v;
  }
}

// ---------- Thin shell (browser APIs) ----------

/**
 * Load an image source onto a canvas, then grayscale + Otsu binarize it.
 * Preprocessing roughly doubles OCR accuracy on photos of paper.
 */
export async function preprocessImage(source: HTMLImageElement | Blob): Promise<HTMLCanvasElement> {
  const img = await loadImage(source);
  // Downscale huge photos: OCR is slow and gains nothing beyond ~2000px
  const maxSide = 2000;
  const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(img.width * scale);
  canvas.height = Math.round(img.height * scale);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D context unavailable");
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  toGrayscale(imageData.data);
  binarize(imageData.data, otsuThreshold(imageData.data));
  ctx.putImageData(imageData, 0, 0);
  return canvas;
}

function loadImage(source: HTMLImageElement | Blob): Promise<HTMLImageElement> {
  if (source instanceof HTMLImageElement) return Promise.resolve(source);
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(source);
    const img = new Image();
    img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("Failed to load image")); };
    img.src = url;
  });
}

/**
 * Recognize text from an image (Chinese + English).
 * First run downloads the language data (~15MB) and caches it; later runs work offline.
 * Caller owns the full lifecycle: this function always terminates its worker.
 */
export async function recognizeProblemText(
  image: HTMLCanvasElement | HTMLImageElement | Blob,
  onProgress?: (p: OcrProgress) => void
): Promise<string> {
  const worker = await createWorker(["chi_sim", "eng"], 1, {
    logger: (m: { status: string; progress: number }) => {
      if (onProgress) onProgress({ status: m.status, progress: m.progress ?? 0 });
    },
  });
  try {
    const { data } = await worker.recognize(image);
    return data.text.trim();
  } finally {
    await worker.terminate();
  }
}
