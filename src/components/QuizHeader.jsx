import { useState } from "react";
import { useI18n } from "../utils/i18n";

export default function QuizHeader({ busy }) {
  const [showHelp, setShowHelp] = useState(false);
  const { lang, setLang, t } = useI18n();
  return (
    <header className="flex h-10 items-center justify-between gap-4 pt-4">
      <div>
        <h1 className="text-3xl font-bold">{t("appTitle")}</h1>
        <p className="text-sm opacity-80">{t("tagline")}</p>
      </div>
      <div className="flex items-center gap-2">
        {/* Language selector */}
        <label className="hidden sm:flex items-center gap-2 text-sm">
          <span className="opacity-70">{t("language")}:</span>
          <select
            className="px-2 py-1 rounded border"
            value={lang}
            onChange={(e) => setLang(e.target.value)}
            disabled={busy}
          >
            <option value="en">🇬🇧 English</option>
            <option value="zh">🇨🇳 中文</option>
            <option value="ar">🇶🇦 العربية</option>
            <option value="es">🇪🇸 Español</option>
            <option value="fr">🇫🇷 Français</option>
            <option value="de">🇩🇪 Deutsch</option>
            <option value="ja">🇯🇵 日本語</option>
            <option value="ko">🇰🇷 한국어</option>
            <option value="ru">🇷🇺 Русский</option>
            <option value="pt">🇵🇹 Português</option>
            <option value="hi">🇮🇳 हिंदी</option>
            <option value="it">🇮🇹 Italiano</option>
          </select>
        </label>

        <button
          disabled={busy}
          className="px-3 py-2 rounded-lg border bg-white hover:bg-gray-100 disabled:opacity-50 text-sm"
          onClick={() => setShowHelp(true)}
        >
          ℹ️ {t("help")}
        </button>
      </div>

      {showHelp && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full p-6 overflow-y-auto max-h-[90vh]">
            <div className="flex justify-between items-stretch">
              <h2 className="flex items-center text-xl font-bold text-gray-900">
                How to Use iQuiz
              </h2>
              <button
                type="button"
                className="px-4 py-1 h-full rounded-lg border bg-red-500 hover:bg-red-400 text-white"
                onClick={() => setShowHelp(false)}
              >
                {t("close")}
              </button>
            </div>

            <div className="space-y-4 text-sm text-gray-800">
              <section>
                <h3 className="font-semibold mb-1">Load Questions</h3>
                <ul className="list-disc list-inside space-y-1">
                  <li>
                    <strong>Upload PDF slides</strong> to auto-generate
                    questions with OpenAI.
                  </li>
                  <li>
                    Import questions via <strong>JSON</strong>.
                    <div className="mt-1">
                      JSON accepts either a plain array or an object with{" "}
                      <code className="bg-gray-50 px-1 rounded border">
                        items
                      </code>
                      :
                    </div>
                    <pre className="mt-1 rounded bg-gray-50 border p-2 text-xs overflow-auto">{`{ "items": [{ "question": "...", "answer": "...", "choices": ["A","B","C","D"], "explanation": "", "tags": ["tag"] }]}`}</pre>
                  </li>
                </ul>
              </section>

              <section>
                <h3 className="font-semibold mb-1">Generation Options</h3>
                <ul className="list-disc list-inside space-y-1">
                  <li>
                    <strong>Model</strong>: pick the OpenAI model used to
                    generate questions. (Higher-capacity models yield better
                    results but will take longer times and cost more.)
                  </li>
                  <li>
                    <strong>Target</strong> (optional): hint the model about
                    target number of questions.{" "}
                    <em>Note: Not a strict limit.</em>
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
                    <strong>Flashcard</strong>: lightweight recall view. Always
                    reveals the answer.
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
                    Selections in Quiz mode and attempts in Short Answer mode
                    are saved while you navigate.
                  </li>
                  <li>
                    Use <strong>Download JSON</strong> to export the current
                    deck.
                  </li>
                </ul>
              </section>

              <section>
                <h3 className="font-semibold mb-1">Session Controls</h3>
                <ul className="list-disc list-inside space-y-1">
                  <li>
                    <strong>Retry</strong>: clears your selections/typed answers
                    and <em>re-shuffles choices</em> for the current deck.
                  </li>
                  <li>
                    <strong>Clear</strong>: removes <em>all questions</em> and
                    resets your progress to an empty state.
                  </li>
                </ul>
              </section>

              <section>
                <h3 className="font-semibold mb-1">Developer Shortcuts</h3>
                <ul className="list-disc list-inside space-y-1">
                  <li>
                    <strong>Load Demo Quiz</strong>: press <kbd>⌘</kbd> +{" "}
                    <kbd>K</kbd> (macOS) or <kbd>Ctrl</kbd> + <kbd>K</kbd>{" "}
                    (Win/Linux).
                  </li>
                </ul>
              </section>
            </div>

            <div className="mt-5 flex justify-end"></div>
          </div>
        </div>
      )}
    </header>
  );
}
