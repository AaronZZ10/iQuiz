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
import QuizHeader from "./components/Header";
import ShortAnswer from "./components/ShortAnswer";
import Answer from "./components/Answer";

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
export default function QuizApp() {
  const [deck, setDeck] = useState([]);
  const [idx, setIdx] = useState(0);
  const [show, setShow] = useState(false);
  const [typed, setTyped] = useState("");
  const [shortMode, setShortMode] = useState(false);
  const [filterTag, setFilterTag] = useState("");
  const [
    { selectedChoice, shortAnswerCorrect, isChoiceCorrect },
    setQuizState,
  ] = useState({
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
  const [savedChoices, setSavedChoices] = useState({});
  const [model, setModel] = useState("gpt-5-nano");
  const [targetCount, setTargetCount] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);

  // Download helpers
  function makeFileName(prefix = "iQuiz_export") {
    const d = new Date();
    const pad = (n) => String(n).padStart(2, "0");
    const ts = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(
      d.getDate()
    )}_${pad(d.getHours())}-${pad(d.getMinutes())}`;
    return `${prefix}_${ts}.json`;
  }

  function downloadDeckJSON() {
    if (!Array.isArray(deck) || deck.length === 0) {
      setStatusMsg?.({
        type: "error",
        text: "Nothing to download — no questions loaded.",
      });
      return;
    }
    const items = deck.map((q) => ({
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
    setStatusMsg?.({
      type: "success",
      text: `Downloaded ${items.length} questions as JSON.`,
    });
  }

  const tags = useMemo(() => {
    const s = new Set();
    deck.forEach((q) => (q.tags || []).forEach((t) => s.add(t)));
    return ["", ...Array.from(s)];
  }, [deck]);

  const visible = useMemo(() => {
    let d = filterTag ? deck.filter((q) => q.tags.includes(filterTag)) : deck;
    if (flaggedOnly) d = d.filter((q) => flaggedIds.has(q.id));
    return d.length ? d : deck;
  }, [deck, filterTag, flaggedOnly, flaggedIds]);

  useEffect(() => {
    function handleKey(e) {
      if (busy) return;
      if (e.key === "ArrowRight" && !(idx >= visible.length - 1)) {
        setIdx((i) => Math.min(i + 1, visible.length - 1));
        setShow(false);
        setTyped("");
        setQuizState({
          selectedChoice: null,
          shortAnswerCorrect: null,
          isChoiceCorrect: null,
        });
      } else if (e.key === "ArrowLeft" && !(idx === 0)) {
        setIdx((i) => Math.max(i - 1, 0));
        setShow(false);
        setTyped("");
        setQuizState({
          selectedChoice: null,
          shortAnswerCorrect: null,
          isChoiceCorrect: null,
        });
      }
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [busy, visible.length, idx]);

  // helper
  function centerChildInScroller(container, el, smooth = true) {
    const cRect = container.getBoundingClientRect();
    const eRect = el.getBoundingClientRect();

    const current = container.scrollLeft;
    // how far the element’s left edge is from the container’s left *in content coords*
    const deltaLeft = eRect.left - cRect.left;
    // move so the element’s center aligns to container center
    const desiredDelta = deltaLeft - (cRect.width / 2 - eRect.width / 2);
    let target = current + desiredDelta;

    // clamp
    const max = container.scrollWidth - container.clientWidth;
    if (target < 0) target = 0;
    if (target > max) target = max;

    container.scrollTo({
      left: target,
      behavior: smooth ? "smooth" : "auto",
    });
  }

  useEffect(() => {
    const container = jumpRef.current;
    if (!container) return;

    const activeButton = container.querySelector(".jump-active");
    if (!activeButton) return;

    // Wait a tick so layout reflects any new render/size changes
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    const raf = requestAnimationFrame(() => {
      centerChildInScroller(container, activeButton, !reduceMotion);
    });
    return () => cancelAnimationFrame(raf);
  }, [idx, visible.length]);

  const current = visible[idx % Math.max(1, visible.length)];
  useEffect(() => {
    const qid = current?.id;
    if (!qid) return;
    const rec = savedChoices[qid];
    if (rec) {
      // restore MCQ and short-answer state if available
      setQuizState((s) => ({
        ...s,
        selectedChoice: rec.choice ?? null,
        isChoiceCorrect: typeof rec.correct === "boolean" ? rec.correct : null,
        shortAnswerCorrect:
          typeof rec.shortCorrect === "boolean" ? rec.shortCorrect : null,
      }));
      if (typeof rec.shortText === "string") {
        setTyped(rec.shortText);
      } else {
        setTyped("");
      }
      // reveal the answer if any saved attempt was incorrect
      const shouldReveal =
        (typeof rec.correct === "boolean" && !rec.correct) ||
        (typeof rec.shortCorrect === "boolean" && !rec.shortCorrect);
      setShow(!!shouldReveal);
    } else {
      // clear for unseen questions
      setQuizState((s) => ({
        ...s,
        selectedChoice: null,
        isChoiceCorrect: null,
        shortAnswerCorrect: null,
      }));
      setTyped("");
      setShow(false);
    }
  }, [current?.id, savedChoices]);

  const isCurrentFlagged = current ? flaggedIds.has(current.id) : false;

  function toggleFlag(id) {
    setFlaggedIds((prev) => {
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
    setQuizState({
      selectedChoice: null,
      shortAnswerCorrect: null,
      isChoiceCorrect: null,
    });
    setFilterTag("");
    setFlaggedIds(new Set());
    setSavedChoices({});
    setDeck((prevDeck) =>
      prevDeck.map((q) => ({
        ...q,
        choices: Array.isArray(q.choices)
          ? [...q.choices].sort(() => Math.random() - 0.5)
          : q.choices,
      }))
    );
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
          throw new Error(
            "JSON must be an array of questions or an object with an 'items' array."
          );
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
    setDeck([]);
    resetQuiz();
    const f = e.target.files?.[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => loadFromText(String(reader.result));
    reader.readAsText(f);
    e.target.value = null;
  }

  function checkShort() {
    const isRight = clean(typed) && clean(typed) === clean(current?.answer);
    setShow(!isRight);
    setQuizState((s) => ({ ...s, shortAnswerCorrect: isRight }));
    if (current?.id != null) {
      setSavedChoices((prev) => ({
        ...prev,
        [current.id]: {
          ...prev[current.id],
          shortText: typed,
          shortCorrect: isRight,
        },
      }));
    }
  }

  async function generateFromPdfStream(slides) {
    const payloadTarget = Number(targetCount) || undefined;
    const payloadModel = model; // from state
    console.log("📦 Streaming request payload:", {
      model: payloadModel,
      target: payloadTarget,
    });
    // Coerce `slides` to a non-empty array of strings. If a File (PDF) was passed, extract text here.
    setBusy(true);
    setDeck([]); // clear existing deck
    resetQuiz();
    let slideArr = slides;
    try {
      // Detect a File-like object for a PDF
      if (
        slideArr &&
        typeof slideArr === "object" &&
        typeof slideArr.arrayBuffer === "function" &&
        (slideArr.type === "application/pdf" ||
          /\.pdf$/i.test(slideArr.name || ""))
      ) {
        setStatusMsg({ type: "info", text: "Extracting slides from PDF…" });
        slideArr = await extractPdfText(slideArr);
      }
    } catch (_) {}

    if (!Array.isArray(slideArr)) {
      throw new Error(
        "No slides extracted (expected an array of slide texts)."
      );
    }
    slideArr = slideArr.map((s) => String(s ?? "").trim()).filter(Boolean);
    if (slideArr.length === 0) {
      throw new Error("No extractable text found in the PDF/slides.");
    }
    try {
      setStatusMsg({
        type: "info",
        text: `Found ${slideArr.length} slides. Generating quiz questions with OpenAI…`,
      });
      const resp = await fetch("http://localhost:5050/generate-quiz-stream", {
        method: "POST",
        mode: "cors",
        headers: {
          "Content-Type": "application/json",
          Accept: "text/event-stream",
        },
        body: JSON.stringify({
          slides: slideArr,
          model: payloadModel,
          target: payloadTarget,
        }),
      });

      // If HTTP failed, surface details
      if (!resp.ok) {
        const txt = await resp.text().catch(() => "");
        throw new Error(
          `Stream HTTP ${resp.status} ${resp.statusText}${
            txt ? ` — ${txt.slice(0, 200)}` : ""
          }`
        );
      }

      // Some browsers (notably Safari) don't expose ReadableStream for CORS + event-stream.
      if (!resp.body || typeof resp.body.getReader !== "function") {
        // Fallback to non-streaming endpoint so UX still works
        const fallback = await fetch("http://localhost:5050/generate-quiz", {
          method: "POST",
          mode: "cors",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            slides: slideArr,
            model: payloadModel,
            target: payloadTarget,
          }),
        });
        if (!fallback.ok) {
          const t = await fallback.text().catch(() => "");
          throw new Error(
            `Fallback HTTP ${fallback.status} ${fallback.statusText}${
              t ? ` — ${t.slice(0, 200)}` : ""
            }`
          );
        }
        const data = await fallback.json();
        const items = (data.items || []).map((q) => ({
          question: String(q.question ?? ""),
          answer: String(q.answer ?? ""),
          choices: Array.isArray(q.choices) ? q.choices.map(String) : [],
          explanation: String(q.explanation ?? ""),
          tags: Array.isArray(q.tags) ? q.tags.map(String) : [],
        }));
        setDeck(normalize(items));
        setStatusMsg({
          type: "success",
          text: `Generated ${items.length} questions (fallback, no streaming).`,
        });
        setBusy(false);
        return;
      }

      // Streaming path (SSE over fetch)
      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buf = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });

        // Split into SSE frames separated by blank lines
        const frames = buf.split("\n\n");
        buf = frames.pop() || ""; // leftover partial frame

        for (const frame of frames) {
          const lines = frame.split("\n");
          const event =
            lines
              .find((l) => l.startsWith("event:"))
              ?.slice(6)
              .trim() || "message";
          const dataLines = lines
            .filter((l) => l.startsWith("data:"))
            .map((l) => l.slice(5));
          const dataRaw = dataLines.join("\n").trim() || "{}";

          try {
            const payload = JSON.parse(dataRaw);
            if (event === "item") {
              setDeck((d) => normalize([...d, payload.item]));
            } else if (event === "done") {
              setBusy(false);
              setStatusMsg({
                type: "success",
                text: `Done! Received ${payload.total} questions.`,
              });
            } else if (event === "error") {
              setBusy(false);
              setStatusMsg({
                type: "error",
                text: payload.error || "Stream error.",
              });
            }
          } catch (e) {
            // Ignore parse errors from partial frames; keep buffering
            // Optionally log: console.debug("SSE parse issue:", e, { event, dataRaw });
          }
        }
      }
    } catch (err) {
      setStatusMsg({ type: "error", text: `Failed: ${err.message}` });
      throw err;
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        <QuizHeader
          demoDeck={demoDeck}
          setDeck={setDeck}
          setIdx={setIdx}
          setShow={setShow}
          setTyped={setTyped}
          busy={busy}
          setStatusMsg={setStatusMsg}
          setShortAnswer={(val) =>
            setQuizState((s) => ({ ...s, shortAnswerCorrect: val }))
          }
          setSelectedChoice={(v) =>
            setQuizState((s) => ({ ...s, selectedChoice: v }))
          }
        />

        {/* Status banner */}
        {statusMsg && <StatusBanner statusMsg={statusMsg} busy={busy} />}

        {/* Loader controls */}
        <UploadPDF
          generateFromPdf={generateFromPdfStream}
          busy={busy}
          setStatusMsg={setStatusMsg}
          setBusy={setBusy}
          model={model}
          setModel={setModel}
          targetCount={targetCount}
          setTargetCount={setTargetCount}
        />
        <LoadQuestions
          loadFromText={loadFromText}
          busy={busy}
          fileRef={fileRef}
          onFile={onFile}
          downloadDeckJSON={downloadDeckJSON}
          deck={deck}
        />

        {/* Quiz Card */}
        <div className="rounded-2xl border bg-white p-6">
          {/* Controls Bar */}
          <ControlsBar
            {...{
              busy,
              flashMode,
              setFlashMode,
              shortMode,
              setShortMode,
              setShow,
              setTyped,
              tags,
              filterTag,
              setFilterTag,
              setIdx,
              setFlaggedOnly,
              toggleFlag,
              currentId: current?.id,
              isCurrentFlagged,
              flaggedOnly,
              downloadDeckJSON,
              deck,
              resetQuiz,
              flaggedIds,
              setDeck,
              showConfirm,
              setShowConfirm,
              setStatusMsg,
            }}
            setSelectedChoice={(v) =>
              setQuizState((s) => ({ ...s, selectedChoice: v }))
            }
            setIsChoiceCorrect={(v) =>
              setQuizState((s) => ({ ...s, isChoiceCorrect: v }))
            }
            setShortAnswer={(v) =>
              setQuizState((s) => ({ ...s, shortAnswerCorrect: v }))
            }
          />

          {/* Top toolbar */}
          {current ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-xs uppercase tracking-wider opacity-70">
                <span>
                  Question {idx + 1} / {visible.length}
                  {filterTag ? ` (tag: ${filterTag})` : ""}
                </span>

                <button
                  type="button"
                  className={
                    "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] border " +
                    (isCurrentFlagged
                      ? "bg-yellow-100 text-yellow-800 border-yellow-300"
                      : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50")
                  }
                  onClick={() => current && toggleFlag(current.id)}
                  disabled={busy || !current}
                  title={
                    isCurrentFlagged
                      ? "Unflag this question"
                      : "Flag this question"
                  }
                  aria-pressed={isCurrentFlagged ? "true" : "false"}
                >
                  {isCurrentFlagged ? "★ Flagged" : "☆ Flag"}
                </button>
              </div>
              <h2 className="text-2xl font-semibold min-h-[4rem]">
                {current.question}
              </h2>

              {/* Jump bar (scrollable, non-wrapping) */}
              <div className="flex items-center gap-2">
                {/* <button
                  type="button"
                  className="px-2 py-1 text-xs rounded border bg-white hover:bg-gray-100 disabled:opacity-50"
                  onClick={() =>
                    jumpRef.current?.scrollBy({
                      left: -240,
                      behavior: "smooth",
                    })
                  }
                  disabled={busy}
                  aria-label="Scroll left"
                  title="Scroll left"
                >
                  ◀
                </button> */}

                <div
                  ref={jumpRef}
                  className="overflow-x-auto pb-3"
                  style={{ scrollbarGutter: "stable" }}
                >
                  <div className="flex flex-nowrap whitespace-nowrap gap-1 py-1">
                    {visible.map((q, i) => {
                      const isActive = i === idx;
                      const isFlagged = flaggedIds.has(q.id);
                      let cls = "px-2 py-1 text-xs rounded border shrink-0";
                      if (isActive)
                        cls +=
                          " ring-2 ring-blue-400 border-blue-400 jump-active";
                      if (isFlagged) cls += " bg-yellow-100 border-yellow-300";
                      else cls += " bg-white";

                      return (
                        <button
                          key={q.id ?? i}
                          className={cls}
                          onClick={(e) => {
                            setIdx(i);
                            setShow(false);
                            setQuizState({
                              selectedChoice: null,
                              shortAnswerCorrect: null,
                              isChoiceCorrect: null,
                            });
                            e.currentTarget.blur();
                          }}
                          title={`Go to question ${i + 1}${
                            isFlagged ? " (flagged)" : ""
                          }`}
                          disabled={busy}
                        >
                          {i + 1}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* <button
                  type="button"
                  className="px-2 py-1 text-xs rounded border bg-white hover:bg-gray-100 disabled:opacity-50"
                  onClick={() =>
                    jumpRef.current?.scrollBy({ left: 240, behavior: "smooth" })
                  }
                  disabled={busy}
                  aria-label="Scroll right"
                  title="Scroll right"
                >
                  ▶
                </button> */}
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
                        if (isCorrect && isChosen)
                          cls += " border-green-500 bg-green-50";
                        if (!isCorrect && isChosen)
                          cls += " border-red-500 bg-red-50";
                      }

                      return (
                        <button
                          key={i}
                          className={cls}
                          disabled={busy}
                          onClick={(e) => {
                            e.currentTarget.blur();
                            setQuizState({
                              selectedChoice: c,
                              isChoiceCorrect: isCorrect,
                              shortAnswerCorrect,
                            });
                            if (current?.id != null) {
                              setSavedChoices((prev) => ({
                                ...prev,
                                [current.id]: { choice: c, correct: isCorrect },
                              }));
                            }
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
                {selectedChoice === null ? (
                  <br />
                ) : isChoiceCorrect ? (
                  <span className="text-green-700">✅ Correct!</span>
                ) : (
                  <span className="text-red-700">
                    ❌ Not quite — see the correct answer below.
                  </span>
                )}
              </div>

              {shortMode && (
                <ShortAnswer
                  {...{
                    typed,
                    setTyped,
                    answer: current.answer,
                    busy,
                    shortAnswerCorrect,
                  }}
                  checkShort={checkShort}
                />
              )}

              {/** Answer */}
              {(flashMode || show) && <Answer current={current} />}

              {/* Navigation (previous & next) */}
              <Nav
                {...{ setIdx, idx, visible, busy, setTyped, setShow }}
                {...{
                  setShortAnswer: (val) =>
                    setQuizState((s) => ({ ...s, shortAnswerCorrect: val })),
                  setSelectedChoice: (val) =>
                    setQuizState((s) => ({ ...s, selectedChoice: val })),
                  setIsChoiceCorrect: (val) =>
                    setQuizState((s) => ({ ...s, isChoiceCorrect: val })),
                }}
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
