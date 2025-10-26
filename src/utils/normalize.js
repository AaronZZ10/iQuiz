export function normalize(items) {
  return items.map((q, i) => ({
    id: i + 1,
    question: (q.question || "").trim(),
    answer: (q.answer || "").trim(),
    choices: Array.isArray(q.choices) ? q.choices : [],
    explanation: q.explanation || "",
    tags: Array.isArray(q.tags) ? q.tags : [],
  }));
}


export const normalizeOne = (q) => normalize([q])[0];