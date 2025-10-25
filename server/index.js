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

const SYSTEM_NDJSON = `You generate exam-style questions from slide text.
STREAM output as NDJSON (one JSON object per line). Do NOT wrap with an array. Do NOT include any prose before/after.
Each line must be a single compact JSON object with this shape:
{
  "question": "string",
  "answer": 0,                     // for TF, use 0 for True 1 for False, for MCQ use the index of the correct choice in choices[]
  "choices": ["string", "string", ...],   // required for MCQ (3-4 choices), T/F for True/False questions
  "explanation": "string",                // optional
  "tags": ["string", ...]
}
Rules:
- Prefer concise, unambiguous phrasing.
- MCQ and T/F only. 3-4 choices for MCQ.
- Focus on definitions, formulas, processes, comparisons, and pitfalls.
- Use only provided slides content.
- Output one JSON object per line.`;

function normalizeItem(it) {
  if (!it || typeof it !== "object") return null;
  const q = String(it.question ?? "").trim();
  if (!q) return null;
  let answer = it.answer;
  if (typeof answer === "number") {
    if (Array.isArray(it.choices) && it.choices.length > answer) {
      answer = it.choices[answer];
    } else if (answer === 0 || answer === 1) {
      answer = answer === 0 ? "True" : "False";
    }
  } else if (typeof answer === "string" && /^[0-3]$/.test(answer.trim())) {
    const idx = parseInt(answer.trim(), 10);
    if (Array.isArray(it.choices) && it.choices.length > idx) {
      answer = it.choices[idx];
    } else if (idx === 0 || idx === 1) {
      answer = idx === 0 ? "True" : "False";
    }
  }
  const out = {
    question: q,
    answer: String(answer ?? ""),
    choices: Array.isArray(it.choices) ? it.choices.map((c) => String(c)) : [],
    explanation: String(it.explanation ?? ""),
    tags: Array.isArray(it.tags) ? it.tags.map((t) => String(t)) : [],
  };
  return out;
}
// Streamed generation: sends NDJSON items over SSE as they arrive
app.post("/generate-quiz-stream", async (req, res) => {
  try {
    const { slides, model, target } = req.body;
    const ALLOWED_MODELS = new Set([
      "gpt-5-nano",
      "gpt-5-mini",
      "gpt-5",
      "gpt-4o-mini",
    ]);
    const modelToUse = ALLOWED_MODELS.has(model) ? model : "gpt-5-nano";
    if (!Array.isArray(slides) || slides.length === 0) {
      return res.status(400).json({ error: "slides[] required" });
    }

    // Set SSE headers
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders?.();

    const extra = Number(target)
      ? `Please generate about ${Math.floor(target)} total questions.`
      : "";

    const user = [
      { type: "text", text: "Slides text:\n" + slides.join("\n---\n") },
      { type: "text", text: `Stream NDJSON now. ${extra}` },
    ];

    console.log(`🧠 Using OpenAI model: ${modelToUse} (streaming NDJSON)`);
    
    console.log(`💬 User messages: ${JSON.stringify(user)}`);
    const stream = await openai.chat.completions.create({
      model: modelToUse,
      stream: true,
      messages: [
        { role: "system", content: SYSTEM_NDJSON },
        { role: "user", content: user },
      ],
    });

    let buffer = "";
    const seen = new Set();

    // helper to emit SSE events
    const send = (event, payload) => {
      res.write(`event: ${event}\n`);
      res.write(`data: ${JSON.stringify(payload)}\n\n`);
    };

    for await (const part of stream) {
      const delta = part?.choices?.[0]?.delta?.content || "";
      if (!delta) continue;

      buffer += delta;

      // Try to extract complete JSON lines (split by newline)
      let nl;
      while ((nl = buffer.indexOf("\n")) !== -1) {
        const line = buffer.slice(0, nl).trim();
        buffer = buffer.slice(nl + 1);
        if (!line) continue;
        // Attempt to parse one JSON object per line
        try {
          const raw = JSON.parse(line);
          const norm = normalizeItem(raw);
          if (norm) {
            // dedupe by question text
            const key = norm.question.toLowerCase();
            if (!seen.has(key)) {
              seen.add(key);
              send("item", { item: norm });
            }
          }
        } catch (err) {
          // If not JSON yet, accumulate (skip)
        }
      }
    }

    // After stream ends, there might be a last (no-newline) object
    const last = buffer.trim();
    if (last) {
      try {
        const raw = JSON.parse(last);
        const norm = normalizeItem(raw);
        if (norm) {
          const key = norm.question.toLowerCase();
          if (!seen.has(key)) {
            seen.add(key);
            send("item", { item: norm });
          }
        }
      } catch (_) {}
    }

    send("done", { total: seen.size });
    res.end();
  } catch (e) {
    console.error(e);
    // send an SSE error event if possible
    try {
      res.write(`event: error\n`);
      res.write(
        `data: ${JSON.stringify({ error: String(e?.message || e) })}\n\n`
      );
    } catch {}
    res.end();
  }
});

app.post("/generate-quiz", async (req, res) => {
  try {
    const { slides, model, target } = req.body;
    const ALLOWED_MODELS = new Set([
      "gpt-5-nano",
      "gpt-5-mini",
      "gpt-5",
      "gpt-4o-mini",
    ]);
    const modelToUse = ALLOWED_MODELS.has(model) ? model : "gpt-5-nano";

    if (!Array.isArray(slides) || !slides.length) {
      return res.status(400).json({ error: "slides[] required" });
    }

    const chunks = chunkSlides(slides);
    const allItems = [];

    for (const group of chunks) {
      const extra = Number(target)
        ? `Generate ${Math.floor(target)} total questions.`
        : "";

      const user = [
        { type: "text", text: "Slides text:\n" + group.join("\n---\n") },
        { type: "text", text: `Produce JSON now. ${extra}` },
      ];
      console.log(`🧠 Using OpenAI model: ${modelToUse}`);
      console.log(`💬 User messages: ${JSON.stringify(user)}`);

      const resp = await openai.chat.completions.create({
        model: modelToUse,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: SYSTEM },
          { role: "user", content: user },
        ],
      });
      console.log("⬅️ Received response from OpenAI:");
      console.log(String(resp.choices[0].message.content));

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
          return { ...it, answer: String(answer) };
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
