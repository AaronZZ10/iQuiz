// src/App.js
import { useMemo, useRef, useState, useEffect } from "react";
import { extractPdfText } from "./utils/pdf";
import demoDeck from "./utils/demoDeck";
import { parseCSV } from "./utils/csv";
import { normalize } from "./utils/normalize";
import ControlsBar from "./components/ControlsBar";
import Nav from "./components/Nav";
import StatusBanner from "./components/StatusBanner";
import LoadQuestions from "./components/LoadQuestions";
import UploadPDF from "./components/UploadPDF";
import Head from "./components/Header";
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
  const [flaggedIds, setFlaggedIds] = useState(new Set());
  const [flaggedOnly, setFlaggedOnly] = useState(false);
  const [busy, setBusy] = useState(false);
  const [statusMsg, setStatusMsg] = useState(null); 
  const fileRef = useRef(null);
  const jumpRef = useRef(null);


  // Download helpers
  function makeFileName(prefix = "quizzer-export") {
    const d = new Date();
    const pad = (n) => String(n).padStart(2, "0");
    const ts = `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}_${pad(d.getHours())}-${pad(d.getMinutes())}`;
    return `${prefix}_${ts}.json`;
  }

  function downloadDeckJSON() {
    if (!Array.isArray(deck) || deck.length === 0) {
      setStatusMsg?.({ type: "error", text: "Nothing to download — no questions loaded." });
      return;
    }
    const items = deck.map(q => ({
      question: q.question ?? "",
      answer: q.answer ?? "",
      choices: Array.isArray(q.choices) ? q.choices : [],
      explanation: q.explanation ?? "",
      tags: Array.isArray(q.tags) ? q.tags : [],
    }));
    const json = JSON.stringify({ items }, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = makeFileName();
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    setStatusMsg?.({ type: "success", text: `Downloaded ${items.length} questions as JSON.` });
  }

  const tags = useMemo(() => {
    const s = new Set();
    deck.forEach((q) => (q.tags || []).forEach((t) => s.add(t)));
    return ["", ...Array.from(s)];
  }, [deck]);

  const visible = useMemo(() => {
    let d = filterTag ? deck.filter((q) => q.tags.includes(filterTag)) : deck;
    if (flaggedOnly) d = d.filter(q => flaggedIds.has(q.id));
    return d.length ? d : deck;
  }, [deck, filterTag, flaggedOnly, flaggedIds]);

  useEffect(() => {
    function handleKey(e) {
      if (busy) return;
      if (e.key === "ArrowRight") {
        setIdx((i) => Math.min(i + 1, visible.length - 1));
        setShow(false);
        setTyped("");
        setQuizState({ selectedChoice: null, shortAnswerCorrect: null, isChoiceCorrect: null });
      } else if (e.key === "ArrowLeft") {
        setIdx((i) => Math.max(i - 1, 0));
        setShow(false);
        setTyped("");
        setQuizState({ selectedChoice: null, shortAnswerCorrect: null, isChoiceCorrect: null });
      }
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [busy, visible.length]);


  const current = visible[idx % Math.max(1, visible.length)];

  const isCurrentFlagged = current ? flaggedIds.has(current.id) : false;

  function toggleFlag(id) {
    setFlaggedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function resetQuiz() {
    setShow(false);
    setTyped("");
    setIdx(0);
    setQuizState({ selectedChoice: null, shortAnswerCorrect: null, isChoiceCorrect: null });
    setFlaggedIds(new Set());
  }

  function loadFromText(text) {
    try {
      let items = [];
            const trimmed = (text || "").trim();

      // Accept JSON array OR JSON object with { items: [...] }
      if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) {
          items = parsed;
        } else if (parsed && Array.isArray(parsed.items)) {
          items = parsed.items;
        } else {
          throw new Error("JSON must be an array of questions or an object with an 'items' array.");
        }
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
          setSelectedChoice={(v) => setQuizState((s) => ({ ...s, selectedChoice: v }))} 
        />

        {/* Status banner */}
        {statusMsg && <StatusBanner statusMsg={statusMsg} busy={busy} />}

        {/* Loader controls */}
        <UploadPDF
          generateFromPdf={generateFromPdf}
          busy={busy}
          setStatusMsg={setStatusMsg}
          setBusy={setBusy}
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
          <ControlsBar {...{ busy, flashMode, setFlashMode, shortMode, setShortMode, setShow, setTyped, tags, filterTag, setFilterTag, setIdx,setFlaggedOnly,toggleFlag,currentId: current?.id,isCurrentFlagged,flaggedOnly, downloadDeckJSON, deck }} 
            setSelectedChoice={(v) => setQuizState((s) => ({ ...s, selectedChoice: v }))} 
            setIsChoiceCorrect={(v) => setQuizState((s) => ({ ...s, isChoiceCorrect: v }))}
            setShortAnswer={(v) => setQuizState((s) => ({ ...s, shortAnswerCorrect: v }))} />

          {/* Top toolbar */}
          
          {current ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-xs uppercase tracking-wider opacity-70">
                <span>Question {idx + 1} / {visible.length}{filterTag ? ` (tag: ${filterTag})` : ""}</span>
                {isCurrentFlagged && (
                  <span className="inline-flex items-center rounded-full bg-yellow-100 text-yellow-800 px-2 py-0.5 text-[10px] border border-yellow-300">
                    ★ Flagged
                  </span>
                )}
              </div>
              <h2 className="text-2xl font-semibold">{current.question}</h2>
              
              {/* Jump bar (scrollable, non-wrapping) */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="px-2 py-1 text-xs rounded border bg-white hover:bg-gray-100 disabled:opacity-50"
                  onClick={() => jumpRef.current?.scrollBy({ left: -240, behavior: "smooth" })}
                  disabled={busy}
                  aria-label="Scroll left"
                  title="Scroll left"
                >
                  ◀
                </button>

                <div ref={jumpRef} className="overflow-x-auto">
                  <div className="flex flex-nowrap whitespace-nowrap gap-1 py-1">
                    {visible.map((q, i) => {
                      const isActive = i === idx;
                      const isFlagged = flaggedIds.has(q.id);
                      let cls = "px-2 py-1 text-xs rounded border shrink-0";
                      if (isActive) cls += " ring-2 ring-blue-400 border-blue-400";
                      if (isFlagged) cls += " bg-yellow-100 border-yellow-300";
                      else cls += " bg-white";

                      return (
                        <button
                          key={q.id ?? i}
                          className={cls}
                          onClick={() => {
                            setIdx(i);
                            setShow(false);
                            setTyped("");
                            setQuizState({ selectedChoice: null, shortAnswerCorrect: null, isChoiceCorrect: null });
                          }}
                          title={`Go to question ${i + 1}${isFlagged ? " (flagged)" : ""}`}
                          disabled={busy}
                        >
                          {i + 1}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <button
                  type="button"
                  className="px-2 py-1 text-xs rounded border bg-white hover:bg-gray-100 disabled:opacity-50"
                  onClick={() => jumpRef.current?.scrollBy({ left: 240, behavior: "smooth" })}
                  disabled={busy}
                  aria-label="Scroll right"
                  title="Scroll right"
                >
                  ▶
                </button>
              </div>

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
