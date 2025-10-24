export default function LoadQuestions({ loadFromText, busy, fileRef , onFile}) {
  return (
    
            <div className="rounded-2xl border bg-white p-4 space-y-3">
              <div className="flex flex-wrap items-center gap-3">
                <label>Upload your own questions in JSON</label>
                <input
                  type="file"
                  ref={fileRef}
                  onChange={onFile}
                  accept=".json"
                  disabled={busy}
                  className="ml-auto"
                />
              </div>
    
              {/* Paste area */}
              {/* <details className="rounded-xl border p-3">
                <summary className="cursor-pointer font-medium">
                  Paste JSON / CSV
                </summary>
                <textarea
                  id="paste"
                  rows={8}
                  className="mt-3 w-full rounded-lg border p-2"
                  placeholder='[{"question":"?","answer":"!"}] or\nquestion,answer,choices,explanation,tags'
                  disabled={busy}
                />
                <div className="mt-2 flex gap-2">
                  <button
                    className="px-3 py-2 rounded-lg border bg-white hover:bg-gray-100 disabled:opacity-50"
                    disabled={busy}
                    onClick={() => {
                      const el = document.getElementById("paste");
                      loadFromText(el.value);
                    }}
                  >
                    Load from text
                  </button>
                  <button
                    className="px-3 py-2 rounded-lg border bg-white hover:bg-gray-100 disabled:opacity-50"
                    disabled={busy}
                    onClick={() => {
                      const el = document.getElementById("paste");
                      el.value = JSON.stringify(demoDeck, null, 2);
                    }}
                  >
                    Insert example JSON
                  </button>
                </div>
              </details> */}
            </div>
    
  );
}
