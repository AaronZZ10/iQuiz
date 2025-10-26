export default function LoadQuestions({
  busy,
  fileRef,
  onFile,
  downloadDeckJSON,
  deck,
}) {
  return (
    <div className="rounded-2xl border bg-white p-4 space-y-3">
      <div className="flex flex-col items-start sm:flex-row sm:items-center sm:justify-between gap-3 text-sm">
        <label className="font-bold flex items-center gap-2">
          Download/Load Questions in JSON
        </label>

        <button
          type="button"
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border self-start sm:mx-auto w-auto"
          onClick={downloadDeckJSON}
          disabled={busy || deck.length === 0}
          title="Download all questions as JSON"
        >
          ⬇️ Download Questions
        </button>
        <div className="self-start sm:ml-auto">
          <input
            type="file"
            ref={fileRef}
            onChange={onFile}
            accept=".json"
            disabled={busy}
            id="fileQInput"
            className="hidden"
          />
          <label
            htmlFor="fileQInput"
            className={`inline-flex px-3 py-2 rounded-lg border cursor-pointer self-start
      ${busy ? "opacity-50 cursor-not-allowed" : "bg-white hover:bg-gray-100"}
    `}
          >
            📂 Load Questions
          </label>
        </div>
      </div>
    </div>
  );
}
