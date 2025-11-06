import "dotenv/config";
import express from "express";
import cors from "cors";
import OpenAI from "openai";
import { GoogleGenerativeAI } from "@google/generative-ai";
import path from "path";
import { fileURLToPath } from "url";

const app = express();
app.use(express.json({ limit: "10mb" }));

const allowed = [
  "http://localhost:3000",
  "https://iquiz-1.onrender.com",
  "https://aaronzz10.github.io/iQuiz",
  "https://aaronzz10.github.io",
];
app.use(cors({ origin: allowed }));

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const gemini = process.env.GOOGLE_API_KEY
  ? new GoogleGenerativeAI(process.env.GOOGLE_API_KEY)
  : null;

const OPENAI_MODELS = new Set(["gpt-5-nano", "gpt-5-mini", "gpt-5"]);
const GEMINI_MODELS = new Set([
  "gemini-2.5-flash",
  "gemini-2.5",
  "gemini-2.5-flash-lite",
]);
const isGemini = (m) => GEMINI_MODELS.has(m);
const isOpenAI = (m) => OPENAI_MODELS.has(m);

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
- Use same language as input slides.
- MCQ and T/F only. 3-4 choices for MCQ.
- Focus on definitions, formulas, processes, comparisons, and pitfalls.
- No external facts; use only provided slides.
- Keep each question self-contained.
- 5 questions minimum.`;

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
- Use same language as input slides.
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
    const modelToUse =
      isOpenAI(model) || isGemini(model) ? model : "gemini 2.5-flash-lite";

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

    if (isGemini(modelToUse)) {
      if (!gemini) {
        res.write(`event: error\n`);
        res.write(
          `data: ${JSON.stringify({
            error: "GOOGLE_API_KEY not set on server",
          })}\n\n`
        );
        return res.end();
      }
      console.log(`🧠 Using Gemini model: ${modelToUse} (streaming NDJSON)`);

      const gModel = gemini.getGenerativeModel({
        model: modelToUse,
        systemInstruction: SYSTEM_NDJSON,
      });

      const promptParts = [
        { text: "Slides text:\n" + slides.join("\n---\n") },
        { text: `Stream NDJSON now. ${extra}` },
      ];

      let buffer = "";
      const seen = new Set();
      const send = (event, payload) => {
        res.write(`event: ${event}\n`);
        res.write(`data: ${JSON.stringify(payload)}\n\n`);
      };

      try {
        const result = await gModel.generateContentStream(promptParts);
        console.log(
          "🧠 Gemini prompt:",
          promptParts.map((p) => p.text).join("\n\n")
        );

        let fullGeminiResponse = "";

        for await (const chunk of result.stream) {
          // Be defensive: some SDK builds throw when parsing; extract text from multiple shapes
          let delta = "";
          try {
            delta = typeof chunk.text === "function" ? chunk.text() : "";
            if (!delta && chunk?.candidates?.length) {
              const parts = chunk.candidates[0]?.content?.parts || [];
              delta = parts.map((p) => p?.text || "").join("");
            }
            fullGeminiResponse += delta;
          } catch (_) {
            // ignore and let delta stay empty
          }
          if (!delta) continue;

          buffer += String(delta);

          // Flush complete NDJSON lines or concatenated JSON objects
          const jsonObjects = buffer.match(/\{[^{}]*\}/g);
          if (jsonObjects) {
            for (const line of jsonObjects) {
              let clean = line.trim();
              if (clean.startsWith("```")) {
                clean = clean.replace(/^```json|^```|```$/g, "").trim();
              }
              try {
                const raw = JSON.parse(clean);
                const norm = normalizeItem(raw);
                if (norm) {
                  const key = norm.question.toLowerCase();
                  if (!seen.has(key)) {
                    seen.add(key);
                    send("item", { item: norm });
                  }
                }
              } catch (err) {
                console.warn("⚠️ Failed to parse chunk:", err.message);
              }
            }
            buffer = "";
          }
        }

        // flush tail (no need for newline splitting; handled above)
        let last = buffer.trim();
        if (last.startsWith("```")) {
          last = last.replace(/^```json|^```|```$/g, "").trim();
        }
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
          } catch {}
        }
        console.log("⬅️ Full Gemini streamed response:");
        console.log(fullGeminiResponse);
        send("done", { total: seen.size });
        return res.end();
      } catch (err) {
        console.warn(
          "Gemini stream failed, falling back to non-streaming:",
          String(err?.message || err)
        );
        // Fallback: do a single non-streaming request and stream the items we parse
        try {
          const fallback = await gModel.generateContent(promptParts);
          const text = (await fallback.response).text();
          // Expect NDJSON (per prompt). If not, split by newlines and try JSON per line.
          const lines = String(text || "").split(/\r?\n/);
          for (const rawLine of lines) {
            const line = rawLine.trim();
            if (!line) continue;
            try {
              const obj = JSON.parse(line);
              const norm = normalizeItem(obj);
              if (norm) {
                const key = norm.question.toLowerCase();
                if (!seen.has(key)) {
                  seen.add(key);
                  send("item", { item: norm });
                }
              }
            } catch {}
          }
          send("done", { total: seen.size });
          return res.end();
        } catch (e2) {
          res.write(`event: error\n`);
          res.write(
            `data: ${JSON.stringify({
              error: String(e2?.message || e2),
              hint: "Try '-latest' Gemini models or switch to non-streaming endpoint.",
            })}\n\n`
          );
          return res.end();
        }
      }
    }

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
    const modelToUse =
      isOpenAI(model) || isGemini(model) ? model : "gemini 2.5-flash-lite";

    if (!Array.isArray(slides) || !slides.length) {
      return res.status(400).json({ error: "slides[] required" });
    }

    if (isGemini(modelToUse)) {
      if (!gemini) {
        return res
          .status(400)
          .json({ error: "GOOGLE_API_KEY not set on server" });
      }
      console.log(`🧠 Using Gemini model: ${modelToUse}`);

      const gModel = gemini.getGenerativeModel({
        model: modelToUse,
        systemInstruction: SYSTEM,
      });

      const extra = Number(target)
        ? `Generate ${Math.floor(target)} total questions.`
        : "";

      const promptParts = [
        { text: "Slides text:\n" + slides.join("\n---\n") },
        { text: `Produce JSON now. ${extra}` },
      ];

      const resp = await gModel.generateContent(promptParts);
      const text = (await resp.response).text();
      console.log("⬅️ Received response from Gemini:");
      console.log(String(text));

      let json = {};
      try {
        json = JSON.parse(text || "{}");
      } catch {}
      const items = Array.isArray(json.items) ? json.items : [];

      const processed = items.map((it) => {
        let answer = it.answer;
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
        return { ...it, answer: String(answer ?? "") };
      });

      // Deduplicate by question text
      const seen = new Set();
      const unique = processed.filter((it) => {
        const key = (it.question || "").toLowerCase();
        if (seen.has(key) || !key) return false;
        seen.add(key);
        return true;
      });

      return res.json({ items: unique });
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

// Serve frontend static files
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use(express.static(path.join(__dirname, "../dist")));

app.get("/health", (_, res) => res.status(200).send("ok"));

// Catch-all route for React (Express 5 fix)
app.get(/^(?!\/api).*/, (req, res) => {
  res.sendFile(path.join(__dirname, "../dist", "index.html"));
});

const port = process.env.PORT || 5050;
app.listen(port, () =>
  console.log(`Quiz generator API on http://localhost:${port}`)
);
