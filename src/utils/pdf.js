import { GlobalWorkerOptions, getDocument } from "pdfjs-dist";

// CRA build replaces PUBLIC_URL with the correct base path
GlobalWorkerOptions.workerSrc = `${process.env.PUBLIC_URL}/pdf.worker.min.mjs`;

export async function extractPdfText(file) {
  const data = await file.arrayBuffer();
  const pdf = await getDocument({ data }).promise;

  const pages = [];
  for (let p = 1; p <= pdf.numPages; p++) {
    const page = await pdf.getPage(p);
    const content = await page.getTextContent();
    const text = content.items.map(i => ("str" in i ? i.str : "")).join(" ");
    const cleaned = text.replace(/\s+/g, " ").trim();
    if (cleaned) pages.push(cleaned);
  }
  return pages;
}