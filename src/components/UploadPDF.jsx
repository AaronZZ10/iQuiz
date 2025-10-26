export default function UploadPDF({
  generateFromPdf,
  busy,
  setStatusMsg,
  setBusy,
  model,
  setModel,
  targetCount,
  setTargetCount,
}) {
  return (
    <div className="rounded-2xl border bg-white p-4 space-y-3 m">
      <div className="flex flex-wrap items-center gap-3 text-sm">
        <label className="font-bold">
          Upload Lecture Slides or Notes in PDF to Generate a Quiz with A.I.
        </label>
      </div>
      <div className="flex flex-col items-start sm:flex-row sm:items-center sm:justify-between gap-3 text-sm">
        {/* Left */}
        <label className="flex items-center gap-2">
          Model:
          <select
            className="px-2 py-1 rounded border"
            value={model}
            onChange={(e) => setModel(e.target.value)}
            disabled={busy}
          >
            <option value="gpt-5-nano">GPT-5 nano</option>
            <option value="gpt-5-mini">GPT-5 mini</option>
            <option value="gpt-5">GPT-5</option>
            <option value="gpt-4o-mini">GPT-4o mini</option>
          </select>
        </label>

        {/* Middle */}
        <label className="flex items-center gap-2 sm:mx-auto">
          Target number of questions:
          <input
            type="number"
            min={1}
            inputMode="numeric"
            className="w-16 px-2 py-1 rounded border"
            value={targetCount}
            onChange={(e) => setTargetCount(e.target.value)}
            placeholder="N/A"
            disabled={busy}
            title="Limit the number of questions to generate (optional)"
          />
        </label>

        {/* Right */}
        <input
          type="file"
          accept=".pdf, application/pdf"
          disabled={busy}
          id="fileInput"
          onChange={async (e) => {
            const f = e.target.files?.[0];
            if (!f) return;
            try {
              await generateFromPdf(f);
            } catch (err) {
              setStatusMsg({ type: "error", text: `Failed: ${err.message}` });
              setBusy(false);
            } finally {
              e.target.value = null;
            }
          }}
          className="hidden"
        />
        <label
          htmlFor="fileInput"
          className={`px-3 py-2 rounded-lg border cursor-pointer sm:ml-auto
      ${busy ? "opacity-50 cursor-not-allowed" : "bg-white hover:bg-gray-100"}
    `}
        >
          📂 Upload PDF File
        </label>
      </div>
    </div>
  );
}
