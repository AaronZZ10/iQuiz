import { useMemo, useRef, useState, useEffect, useCallback } from "react";
import { extractPdfText } from "./utils/pdf";
import demoDeck from "./utils/demoDeck";
import { parseCSV } from "./utils/csv";
import { normalize } from "./utils/normalize";
import ControlsBar from "./components/ControlsBar";
import Nav from "./components/Nav";
import StatusBanner from "./components/StatusBanner";
import LoadQuestions from "./components/DownloadLoadQuestions";
import UploadPDF from "./components/UploadPDF";
import QuizHeader from "./components/QuizHeader";
import ShortAnswer from "./components/ShortAnswer";
import Answer from "./components/Answer";
import JumperBar from "./components/JumperBar";
import MCQ from "./components/MCQ";
import QuestionBar from "./components/QuestionBar";
import { API_BASE } from "./configure";

const clean = (s) =>
  (s ?? "")
    .toString()
    .normalize("NFKD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, " ")
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
  const [model, setModel] = useState("gemini-2.5-flash-lite");
  const [targetCount, setTargetCount] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);
  const [canDownload, setCanDownload] = useState(false);
  const [slidesName, setSlidesName] = useState(null);

  // Download helpers
  function makeFileName(prefix = "iQuiz") {
    const safeSlideName = (slidesName || "untitled")
      .replace(/\.pdf$/i, "")
      .replace(/\s+/g, "_");
    return `${prefix}_${safeSlideName}.json`;
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
      text: `Downloaded ${
        items.length
      } questions in ${makeFileName()} successfully.`,
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

  const handleKey = useCallback(
    (e) => {
      if (busy) return;
      if (e.key === "ArrowRight" && idx < visible.length - 1) {
        setIdx((i) => Math.min(i + 1, visible.length - 1));
        setShow(false);
        setTyped("");
        setQuizState((s) => ({
          ...s,
          selectedChoice: null,
          shortAnswerCorrect: null,
          isChoiceCorrect: null,
        }));
      } else if (e.key === "ArrowLeft" && idx > 0) {
        setIdx((i) => Math.max(i - 1, 0));
        setShow(false);
        setTyped("");
        setQuizState((s) => ({
          ...s,
          selectedChoice: null,
          shortAnswerCorrect: null,
          isChoiceCorrect: null,
        }));
      }
    },
    [busy, idx, visible.length]
  );

  const controllerRef = useRef(null);
  useEffect(() => () => controllerRef.current?.abort(), []);

  useEffect(() => {
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [handleKey]);

  useEffect(() => {
    const controller = new AbortController();
    return () => controller.abort();
  }, []);

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

  // Dev-only shortcut: Ctrl+K (Win/Linux) or Cmd+K (macOS) to load demo quiz
  useEffect(() => {
    function onDevShortcut(e) {
      const isK = e.key.toLowerCase() === "k";
      const macCombo = e.metaKey && isK; // Cmd+K
      const winCombo = e.ctrlKey && isK; // Ctrl+K
      if (macCombo || winCombo) {
        e.preventDefault();
        if (busy) return;
        try {
          const items = normalize(demoDeck);
          setDeck(items);
          setSlidesName("Demo_Quiz");
          setCanDownload(true);
          setStatusMsg({
            type: "info",
            text: "Loaded demo quiz with 30 questions.",
          });
        } catch (err) {
          setStatusMsg({ type: "error", text: "Failed to load demo quiz." });
        }
      }
    }
    window.addEventListener("keydown", onDevShortcut);
    return () => window.removeEventListener("keydown", onDevShortcut);
  }, [busy]);

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

  function loadFromText(text, fileName) {
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
        text: `Loaded ${items.length} questions from ${fileName}.`,
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
    reader.onload = () => loadFromText(String(reader.result), f.name);
    reader.readAsText(f);
    setCanDownload(false);
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
        text: `Found ${slideArr.length} slides in ${slides.name.replace(
          /\.pdf$/i,
          ""
        )}. Generating quiz questions with Gemini. It can take a couple of minutes.`,
      });
      const resp = await fetch(`${API_BASE}/generate-quiz-stream`, {
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
        const fallback = await fetch(`${API_BASE}/generate-quiz`, {
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
        setCanDownload(true);
        setSlidesName(slides.name || null);
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
              setCanDownload(true);
              setSlidesName(slides.name || null);
              setStatusMsg({
                type: "success",
                text: `Done! Received ${payload.total} questions for ${
                  slides.name.replace(/\.pdf$/i, "") || null
                }.`,
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
        <QuizHeader busy={busy} />

        <div className="relative h-2 mt-0.5 mb-0" aria-live="polite">
          {statusMsg && <StatusBanner statusMsg={statusMsg} busy={busy} />}
        </div>

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
          canDownload={canDownload}
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
              setSlidesName,
              setCanDownload,
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
              <QuestionBar
                current={current}
                busy={busy}
                visible={visible}
                idx={idx}
                filterTag={filterTag}
                toggleFlag={toggleFlag}
                isCurrentFlagged={isCurrentFlagged}
              />

              <h2 className="text-2xl font-semibold min-h-[4rem]">
                {current.question}
              </h2>

              {/* Jump bar (scrollable, non-wrapping) */}
              <JumperBar
                visible={visible}
                idx={idx}
                setIdx={setIdx}
                busy={busy}
                setShow={setShow}
                setQuizState={setQuizState}
                jumpRef={jumpRef}
                flaggedIds={flaggedIds}
              />

              {/* MCQ */}
              {!shortMode && !flashMode && (
                <MCQ
                  {...{
                    current,
                    selectedChoice,
                    isChoiceCorrect,
                    busy,
                    setQuizState,
                    setSavedChoices,
                    setShow,
                  }}
                />
              )}

              {/** Short Answer */}
              {shortMode && (
                <ShortAnswer
                  {...{
                    typed,
                    setTyped,
                    answer: current.answer,
                    busy,
                    shortAnswerCorrect,
                    checkShort,
                  }}
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
            <div className="text-center py-16 opacity-80">
              No questions loaded.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
