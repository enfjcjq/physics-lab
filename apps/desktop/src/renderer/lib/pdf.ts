// ============================================================
// PDF problem input (S76): PDF -> text -> editable input.
// Uses pdfjs-dist in the renderer. Multi-page PDFs are
// concatenated (page text joined by newlines) — no per-page
// preview in this phase.
// ============================================================

import * as pdfjs from "pdfjs-dist";
import workerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";

let workerConfigured = false;
function ensureWorker(): void {
  if (!workerConfigured) {
    pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;
    workerConfigured = true;
  }
}

/**
 * Extract all text from a PDF file (File/Blob). Throws on failure so the
 * caller can surface a non-blocking error (homepage main flow unaffected).
 */
export async function extractTextFromPdf(file: File | Blob): Promise<string> {
  ensureWorker();
  const data = await file.arrayBuffer();
  const loadingTask = pdfjs.getDocument({ data });
  const doc = await loadingTask.promise;
  try {
    const pages: string[] = [];
    for (let i = 1; i <= doc.numPages; i++) {
      const page = await doc.getPage(i);
      const content = await page.getTextContent();
      const pageText = content.items
        .map((it) => ("str" in it ? (it as { str: string }).str : ""))
        .join(" ")
        .replace(/\s+/g, " ")
        .trim();
      if (pageText) pages.push(pageText);
    }
    return pages.join("\n");
  } finally {
    await loadingTask.destroy();
  }
}

/** Returns null when the PDF yields no readable text. */
export async function extractProblemTextFromPdf(file: File | Blob): Promise<string | null> {
  const text = await extractTextFromPdf(file);
  return text.trim().length > 0 ? text.trim() : null;
}
