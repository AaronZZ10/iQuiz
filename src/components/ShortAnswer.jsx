export default function ShortAnswer({ typed, setTyped, checkShort, busy, shortAnswerCorrect }) {
  return (
    <div>
    <div className="flex items-center gap-3">
                  <input
                    value={typed}
                    onChange={(e) => setTyped(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        checkShort();
                      }
                    }}
                    placeholder="Type your answer"
                    className="flex-1 rounded-lg border p-2"
                    disabled={busy}
                  />
                  <button
                    className="px-4 py-2 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 disabled:opacity-50"
                    onClick={() => {
                      checkShort();
                    }}
                    disabled={busy}
                  >
                    Check
                  </button>
                </div>

                <div
                  className={`text-sm font-medium ${
                    shortAnswerCorrect ? "text-green-700" : "text-red-700"
                  }`}
                >
                  {shortAnswerCorrect === null ? <br/> : shortAnswerCorrect ? "✅ Correct!" : "❌ Not quite — see the correct answer below."}
                </div>


    </div>


  );
}
