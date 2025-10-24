import { normalize } from "../utils/normalize.js";

export default function Head({
  demoDeck,
  setDeck,
  setIdx,
  setShow,
  setTyped,
  busy,
  setStatusMsg,
  setShortAnswer,
}) {
  return (
    <header className="flex items-center justify-between gap-4">
      <div>
        <h1 className="text-3xl font-bold">Quizzer</h1>
        <p className="text-sm opacity-80">
          Upload your notes or slides as a PDF, or import a JSON/CSV file to
          instantly turn them into quiz questions powered by ChatGPT.
        </p>
      </div>
      <div className="flex gap-2">
        <button
          disabled={busy}
          className="px-3 py-2 rounded-lg border bg-white hover:bg-gray-100 disabled:opacity-50"
          onClick={() => {
            setDeck(normalize(demoDeck));
            setIdx(0);
            setShow(false);
            setTyped("");
            setStatusMsg(null);
            setShortAnswer(null);
          }}
        >
          Demo Questions
        </button>
      </div>
    </header>
  );
}
