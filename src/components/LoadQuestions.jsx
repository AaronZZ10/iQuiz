export default function LoadQuestions({
  busy,
  fileRef,
  onFile,
  downloadDeckJSON,
  deck,
}) {
  return (
    <div className="rounded-2xl border bg-white p-4 space-y-3">
      <div className="flex flex-wrap items-center gap-3 text-sm ">
        <label className="font-bold mr-auto">
          Download/Load Questions in JSON
        </label>

        <button
          type="button"
          className="px-3 py-1.5 rounded-lg border text-sm m-auto"
          onClick={downloadDeckJSON}
          disabled={busy || deck.length === 0}
          title="Download all questions as JSON"
        >
          Download Questions
        </button>
        <div className="ml-auto">
          <input
            type="file"
            ref={fileRef}
            onChange={onFile}
            accept=".json"
            disabled={busy}
            id="fileQInput"
            className="hidden" // hide native input
          />
          <label
            htmlFor="fileQInput"
            className={`px-3 py-2 rounded-lg border cursor-pointer 
                ${
                  busy
                    ? "opacity-50 cursor-not-allowed"
                    : "bg-white hover:bg-gray-100"
                }`}
          >
            📂 Load Questions
          </label>
        </div>
      </div>
    </div>
  );
}
