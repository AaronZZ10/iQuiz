import { useState } from "react";

export default function QuizHeader({
  busy,
}) {
  const [showHelp, setShowHelp] = useState(false);
  return (
    <header className="flex h-10 items-center justify-between gap-4 pt-4">
      <div>
        <h1 className="text-3xl font-bold">iQuiz</h1>
        <p className="text-sm opacity-80">
          A smart, lightweight web app for reviewing study materials and
          generating quizzes
        </p>
      </div>
      <div className="flex gap-2">
        <button
          disabled={busy}
          className="px-3 py-2 rounded-lg border bg-white hover:bg-gray-100 disabled:opacity-50"
          onClick={() => setShowHelp(true)}
        >
          Help
        </button>
      </div>

      
      {showHelp && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full p-6 overflow-y-auto max-h-[90vh]">
            <h2 className="text-xl font-bold mb-3 text-gray-900">How to Use iQuiz</h2>

            <div className="space-y-4 text-sm text-gray-800">
              <section>
                <h3 className="font-semibold mb-1">Load Questions</h3>
                <ul className="list-disc list-inside space-y-1">
                  <li>
                    <strong>Upload PDF slides</strong> to auto-generate questions
                    with OpenAI.
                  </li>
                  <li>
                    Import questions via <strong>JSON/CSV</strong>.
                    <div className="mt-1">
                      JSON accepts either a plain array or an object with{" "}
                      <code className="bg-gray-50 px-1 rounded border">
                        items
                      </code>
                      :
                    </div>
                    <pre className="mt-1 rounded bg-gray-50 border p-2 text-xs overflow-auto">{`[{ "question": "...", "answer": "...", "choices": ["A","B","C","D"], "explanation": "", "tags": ["tag"] }]`}</pre>
                    <pre className="mt-1 rounded bg-gray-50 border p-2 text-xs overflow-auto">{`{ "items": [ { "question": "...", "answer": "..." } ] }`}</pre>
                    <div className="mt-1">
                      CSV columns:{" "}
                      <code className="bg-gray-50 px-1 rounded border">
                        question,answer,choices,explanation,tags
                      </code>{" "}
                      (choices split by <code>|</code>).
                    </div>
                  </li>
                </ul>
              </section>

              <section>
                <h3 className="font-semibold mb-1">Generation Options</h3>
                <ul className="list-disc list-inside space-y-1">
                  <li>
                    <strong>Model</strong>: pick the OpenAI model used to generate
                    questions. (Higher-capacity models yield better results but will take longer times and cost more.)
                  </li>
                  <li>
                    <strong>Target</strong> (optional): hint the model about how
                    many questions to generate. <em>Note: This is not a strict limit.</em>
                  </li>
                </ul>
              </section>

              <section>
                <h3 className="font-semibold mb-1">Modes</h3>
                <ul className="list-disc list-inside space-y-1">
                  <li>
                    <strong>Quiz (MCQ)</strong>: pick an option.
                  </li>
                  <li>
                    <strong>Short Answer</strong>: type your answer and press{" "}
                    <kbd>Enter</kbd> or click <em>Check</em>.
                  </li>
                  <li>
                    <strong>Flashcard</strong>: lightweight recall view. Always reveals the answer.
                  </li>
                </ul>
              </section>

              <section>
                <h3 className="font-semibold mb-1">Review &amp; Navigation</h3>
                <ul className="list-disc list-inside space-y-1">
                  <li>
                    <strong>Flag</strong> questions and toggle{" "}
                    <em>Review flagged only</em>.
                  </li>
                  <li>
                    <strong>Jump bar</strong>: click numbers to jump; the active
                    question stays auto-scrolled into view.
                  </li>
                  <li>
                    <strong>Keyboard</strong>: use <kbd>←</kbd> and <kbd>→</kbd>{" "}
                    for Previous/Next.
                  </li>
                  <li>
                    Filter by <strong>Tag</strong> from the controls.
                  </li>
                </ul>
              </section>

              <section>
                <h3 className="font-semibold mb-1">Save &amp; Export</h3>
                <ul className="list-disc list-inside space-y-1">
                  <li>
                    Selections in Quiz mode and attempts in Short Answer mode are
                    saved while you navigate.
                  </li>
                  <li>
                    Use <strong>Download JSON</strong> to export the current deck.
                  </li>
                </ul>
              </section>

              <section>
                <h3 className="font-semibold mb-1">Developer Shortcuts</h3>
                <ul className="list-disc list-inside space-y-1">
                  <li>
                    <strong>Load Demo Quiz</strong>: press <kbd>Ctrl</kbd> + <kbd>Alt</kbd> + <kbd>1</kbd> (Windows/Linux) or <kbd>⌘</kbd> + <kbd>1</kbd> (macOS).
                  </li>
                </ul>
              </section>
            </div>

            <div className="mt-5 flex justify-end">
              <button
                type="button"
                className="px-3 py-2 rounded-lg border bg-white hover:bg-gray-100"
                onClick={() => setShowHelp(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      
    </header>
  );
}
