import { normalize } from "../utils/normalize.js";
import { useState } from "react";

export default function Head({
  demoDeck,
  setDeck,
  setIdx,
  setShow,
  setTyped,
  busy,
  setStatusMsg,
  setShortAnswer,
  setSelectedChoice
}) {
  const [showHelp, setShowHelp] = useState(false);
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
            setSelectedChoice(null);
          }}
        >
          Demo Quiz
        </button>
        <button
          disabled={busy}
          className="px-3 py-2 rounded-lg border bg-white hover:bg-gray-100 disabled:opacity-50"
          onClick={() => setShowHelp(true)}
        >
          Help
        </button>
      </div>
      {showHelp && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-lg w-full shadow-lg relative">
            <h2 className="text-xl font-bold mb-3">How to Use Quizzer</h2>
            <ul className="list-disc list-inside space-y-2 text-sm text-gray-700">
              <li>Upload your <strong>PDF slides</strong> to automatically generate questions using ChatGPT.</li>
              <li>Or load your own <strong>JSON/CSV</strong> files with saved questions.</li>
              <li>Select your preferred mode: <strong>Quiz</strong>, <strong>Short Answer</strong>, or <strong>Flashcard</strong>.</li>
              <li>Use the <strong>Flag</strong> button to mark questions for later review.</li>
              <li>Download your generated questions in JSON using the <strong>Download</strong> button.</li>
              <li>Navigate between questions with the <strong>Previous</strong> / <strong>Next</strong> buttons or jump bar.</li>
            </ul>
            <button
              className="mt-5 px-4 py-2 rounded-lg border bg-white hover:bg-gray-100"
              onClick={() => setShowHelp(false)}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
