export function parseCSV(text) {
  const lines = text.split(/\r?\n/).filter(Boolean);
  if (!lines.length) return [];
  const header = lines[0].split(",").map((h) => h.trim().toLowerCase());
  const idx = (k) => header.findIndex((h) => h === k);
  const qi = idx("question"),
    ai = idx("answer"),
    ci = idx("choices"),
    ei = idx("explanation"),
    ti = idx("tags");

  return lines
    .slice(1)
    .map((line) => {
      const cols = line.split(",");
      return {
        question: (cols[qi] || "").trim(),
        answer: (cols[ai] || "").trim(),
        choices: (cols[ci] || "")
          .split("|")
          .map((s) => s.trim())
          .filter(Boolean),
        explanation: (cols[ei] || "").trim(),
        tags: (cols[ti] || "")
          .split(/[;,]/)
          .map((s) => s.trim())
          .filter(Boolean),
      };
    })
    .filter((q) => q.question && q.answer);
}