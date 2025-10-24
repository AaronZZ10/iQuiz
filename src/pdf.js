// src/pdf.js (for pdfjs-dist v4)
import { GlobalWorkerOptions, getDocument } from "pdfjs-dist";

// Point the worker to the bundled module URL (no default export!)
GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url
).toString();

export async function extractPdfText(file) {
  const data = await file.arrayBuffer();
  const pdf = await getDocument({ data }).promise;

  const pages = [];
  for (let p = 1; p <= pdf.numPages; p++) {
    const page = await pdf.getPage(p);
    const content = await page.getTextContent();
    const text = content.items.map(i => ("str" in i ? i.str : "")).join(" ");
    pages.push(text.replace(/\s+/g, " ").trim());
  }
  return pages;
}