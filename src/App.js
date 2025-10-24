// src/App.js
import React, { useMemo, useRef, useState } from "react";
import { extractPdfText } from "./pdf";
import demoDeck from "./demoDeck";
import { parseCSV } from "./utils/csv";
import { normalize } from "./utils/normalize";
import ControlsBar from "./components/ControlsBar";
import Nav from "./components/Nav";
import StatusBanner from "./components/StatusBanner";
import LoadQuestions from "./components/LoadQuestions";
import UploadPDF from "./components/UploadPDF";
import Head from "./components/Head";
import ShortAnswer from "./components/ShortAnswer";
import Answer from "./components/Answer";

// -------- helpers (moved outside component for perf/clarity) --------
const norm = (s) => (s ?? "").toString().trim().toLowerCase();
const clean = (s) =>
  (s ?? "")
    .toString()
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, "")
    .replace(/\b(the|a|an)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();

/* ---------- app ---------- */
export default function App() {
  const [deck, setDeck] = useState([]);
  const [idx, setIdx] = useState(0);
  const [show, setShow] = useState(false);
  const [typed, setTyped] = useState("");
  const [shortMode, setShortMode] = useState(false);
  const [filterTag, setFilterTag] = useState("");
  const [{ selectedChoice, shortAnswerCorrect, isChoiceCorrect }, setQuizState] = useState({
    selectedChoice: null,
    shortAnswerCorrect: null,
    isChoiceCorrect: null,
  });
  const [flashMode, setFlashMode] = useState(false);

  const [busy, setBusy] = useState(false);
  const [statusMsg, setStatusMsg] = useState(null); // {type: "info"|"success"|"error", text: string}

  const fileRef = useRef(null);

  const tags = useMemo(() => {
    const s = new Set();
    deck.forEach((q) => (q.tags || []).forEach((t) => s.add(t)));
    return ["", ...Array.from(s)];
  }, [deck]);

  const visible = useMemo(() => {
    const d = filterTag ? deck.filter((q) => q.tags.includes(filterTag)) : deck;
    return d.length ? d : deck;
  }, [deck, filterTag]);

  const current = visible[idx % Math.max(1, visible.length)];

  function resetQuiz() {
    setShow(false);
    setTyped("");
    setIdx(0);
    setQuizState({ selectedChoice: null, shortAnswerCorrect: null, isChoiceCorrect: null });
  }

  function loadFromText(text) {
    try {
      let items = [];
      if (text.trim().startsWith("[")) {
        const parsed = JSON.parse(text);
        items = Array.isArray(parsed) ? parsed : parsed.items || [];
      } else {
        items = parseCSV(text);
      }
      if (!items.length) throw new Error("No questions found.");
      setDeck(normalize(items));
      resetQuiz();
      setStatusMsg({
        type: "success",
        text: `Loaded ${items.length} questions.`,
      });
    } catch (e) {
      setStatusMsg({ type: "error", text: "Failed to load: " + e.message });
    }
  }

  function onFile(e) {
    const f = e.target.files?.[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => loadFromText(String(reader.result));
    reader.readAsText(f);
  }

  function checkShort() {
    const isRight = clean(typed) && clean(typed) === clean(current?.answer);
    setShow(!isRight);
    setQuizState((s) => ({ ...s, shortAnswerCorrect: isRight }));
  }

  async function generateFromPdf(file) {
    // 1) Extract slides (client-side)
    setBusy(true);
    setStatusMsg({ type: "info", text: "Extracting slides from PDF…" });
    const slides = await extractPdfText(file);
    if (!slides.length) {
      setStatusMsg({
        type: "error",
        text: "No extractable text found in the PDF.",
      });
      setBusy(false);
      return;
    }

    setStatusMsg({
      type: "info",
      text: `Found ${slides.length} slides. Generating quiz questions with ChatGPT…`,
    });

    // 2) Call your backend to generate questions
    const resp = await fetch("http://localhost:5050/generate-quiz", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slides }),
    });
    if (!resp.ok) throw new Error(`Server error ${resp.status}`);
    const data = await resp.json();

    const items = (data.items || []).map((q) => ({
      question: q.question || "",
      answer: q.answer || "",
      choices: Array.isArray(q.choices) ? q.choices : [],
      explanation: q.explanation || "",
      tags: Array.isArray(q.tags) ? q.tags : [],
    }));

    if (!items.length) {
      setStatusMsg({
        type: "error",
        text: "No questions were generated. Try a slide deck with more text.",
      });
      setBusy(false);
      return;
    }

    setDeck(normalize(items));
    resetQuiz();
    setStatusMsg({
      type: "success",
      text: `Success! Generated ${items.length} questions.`,
    });
    setBusy(false);
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        <Head
          demoDeck={demoDeck}
          setDeck={setDeck}
          setIdx={setIdx}
          setShow={setShow}
          setTyped={setTyped}
          busy={busy}
          setStatusMsg={setStatusMsg}
          setShortAnswer={(val) => setQuizState((s) => ({ ...s, shortAnswerCorrect: val }))}
        />

        {/* Status banner */}
        {statusMsg && <StatusBanner statusMsg={statusMsg} busy={busy} />}

        {/* Loader controls */}
        <UploadPDF
          generateFromPdf={generateFromPdf}
          busy={busy}
          setStatusMsg={setStatusMsg}
        />
        <LoadQuestions
          loadFromText={loadFromText}
          busy={busy}
          fileRef={fileRef}
          onFile={onFile}
        />

        {/* Quiz Card */}
        <div className="rounded-2xl border bg-white p-6">
          {/* Controls Bar */}
          <ControlsBar {...{ busy, flashMode, setFlashMode, shortMode, setShortMode, setShow, setTyped, tags, filterTag, setFilterTag, setIdx }} 
            setSelectedChoice={(v) => setQuizState((s) => ({ ...s, selectedChoice: v }))} 
            setIsChoiceCorrect={(v) => setQuizState((s) => ({ ...s, isChoiceCorrect: v }))}
            setShortAnswer={(v) => setQuizState((s) => ({ ...s, shortAnswerCorrect: v }))} />

          {current ? (
            <div className="space-y-4">
              <div className="text-xs uppercase tracking-wider opacity-70">
                Question {idx + 1} / {visible.length}
                {filterTag ? ` (tag: ${filterTag})` : ""}
              </div>
              <h2 className="text-2xl font-semibold">{current.question}</h2>
              
    

              {!shortMode && !flashMode && current.choices?.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {(() => {
                    const answerNorm = norm(current.answer);
                    return current.choices.map((c, i) => {
                      const isChosen = selectedChoice === c;
                      const isCorrect = norm(c) === answerNorm;

                      let cls = "text-left p-3 rounded-xl border hover:shadow";
                      if (selectedChoice !== null) {
                        if (isCorrect && isChosen) cls += " border-green-500 bg-green-50";
                        if (!isCorrect && isChosen) cls += " border-red-500 bg-red-50";
                      }

                      return (
                        <button
                          key={i}
                          className={cls}
                          disabled={busy}
                          onClick={() => {
                            setQuizState({ selectedChoice: c, isChoiceCorrect: isCorrect, shortAnswerCorrect, });
                            setShow(!isCorrect);
                          }}
                        >
                          {c}
                        </button>
                      );
                    });
                  })()}
                </div>
              )}

              <div className="text-sm font-medium">
                {selectedChoice === null ? <br/> : isChoiceCorrect ? (
                  <span className="text-green-700">✅ Correct!</span>
                ) : (
                  <span className="text-red-700">❌ Not quite — see the correct answer below.</span>
                )}
              </div>

              {shortMode && (
                <ShortAnswer
                  {...{ typed, setTyped, answer: current.answer, busy, shortAnswerCorrect }}
                  checkShort={checkShort}
                />
              )}

              {/** Answer */}
              {(flashMode || show) && (<Answer current={current} />)}

              {/* Navigation (previous & next) */}
              <Nav
                {...{ setIdx, idx, visible, busy, setTyped, setShow }}
                {...{ setShortAnswer: (val) => setQuizState((s) => ({ ...s, shortAnswerCorrect: val })), setSelectedChoice: (val) => setQuizState((s) => ({ ...s, selectedChoice: val })), setIsChoiceCorrect: (val) => setQuizState((s) => ({ ...s, isChoiceCorrect: val })) }}
              />

              
            </div>
          ) : (
            <div className="text-center py-16 opacity-80">No cards loaded.</div>
          )}
        </div>
      </div>
    </div>
  );
}
