import "dotenv/config";
import express from "express";
import cors from "cors";
import OpenAI from "openai";

const app = express();
app.use(cors());
app.use(express.json({ limit: "10mb" }));

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Simple chunking to keep prompts reasonable
function chunkSlides(slides, maxChars = 7000) {
  const chunks = [];
  let cur = [];
  let size = 0;
  for (const s of slides) {
    if (size + s.length > maxChars && cur.length) {
      chunks.push(cur);
      cur = [];
      size = 0;
    }
    cur.push(s);
    size += s.length;
  }
  if (cur.length) chunks.push(cur);
  return chunks;
}

const SYSTEM = `You generate exam-style questions from slide text.
Return STRICT JSON following this schema:
{
  "items": [
    {
      "question": "string",
      "answer": 0,                     // for TF, use 0 or 1, for MCQ use the index of the correct choice in choices[]
      "choices": ["string", "string", ...],   // required for MCQ (3-4 choices), T/F for True/False questions
      "explanation": "string",                // optional
      "tags": ["string", ...]                
    }
  ]
}
for exemple:
{
  question: "Which particle carries a negative electric charge?",
  answer: 2,
  choices: ["Proton", "Neutron", "Electron", "Positron"],
  explanation: "Electrons are negatively charged; protons are positive and neutrons are neutral.",
  tags: ["science"],
}

Rules:
- Prefer concise, unambiguous phrasing.
- MCQ and T/F only. 3-4 choices for MCQ.
- Focus on definitions, formulas, processes, comparisons, and pitfalls.
- No external facts; use only provided slides.
- Keep each question self-contained.`;

app.post("/generate-quiz", async (req, res) => {
  try {
    const { slides } = req.body; // array of slide strings
    if (!Array.isArray(slides) || !slides.length) {
      return res.status(400).json({ error: "slides[] required" });
    }

    const chunks = chunkSlides(slides);
    const allItems = [];

    for (const group of chunks) {
      const user = [
        { type: "text", text: "Slides text:\n" + group.join("\n---\n") },
        { type: "text", text: "Produce JSON now." },
      ];

      // Use Chat Completions (works broadly). You can swap to Responses API if you prefer.
      const resp = await openai.chat.completions.create({
        model: "gpt-4o-mini", // economical, good quality; pick a model you have access to
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: SYSTEM },
          { role: "user", content: user },
        ],
        temperature: 0.3,
      });
      console.log("⬅️ Received response from OpenAI:");
      console.log(resp.choices[0].message.content);

      const json = JSON.parse(resp.choices[0].message.content || "{}");
      if (json.items && Array.isArray(json.items)) {
        const processed = json.items.map((it) => {
          let answer = it.answer;
          // Convert numeric answer index to string
          if (typeof answer === "number") {
            if (Array.isArray(it.choices) && it.choices.length > answer) {
              answer = it.choices[answer];
            } else if (answer === 0 || answer === 1) {
              answer = answer === 0 ? "True" : "False";
            }
          } else if (
            typeof answer === "string" &&
            /^[0-3]$/.test(answer.trim())
          ) {
            const idx = parseInt(answer.trim(), 10);
            if (Array.isArray(it.choices) && it.choices.length > idx) {
              answer = it.choices[idx];
            } else if (idx === 0 || idx === 1) {
              answer = idx === 0 ? "True" : "False";
            }
          }
          return { ...it, answer };
        });
        allItems.push(...processed);
      }
    }

    // Deduplicate by question text
    const seen = new Set();
    const unique = allItems.filter((it) => {
      const key = (it.question || "").toLowerCase();
      if (seen.has(key) || !key) return false;
      seen.add(key);
      return true;
    });

    res.json({ items: unique });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: String(e?.message || e) });
  }
});

const port = process.env.PORT || 5050;
app.listen(port, () =>
  console.log(`Quiz generator API on http://localhost:${port}`)
);
