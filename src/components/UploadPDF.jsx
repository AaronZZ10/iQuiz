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
    <div className="rounded-2xl border bg-white p-4 space-y-3">
      <div className="flex flex-wrap items-center gap-3 text-sm">
       <label className="font-bold">Upload Lecture Slides in PDF to Generate a Quiz with A.I.</label>
      </div>
      <div className="flex flex-wrap items-center gap-3 text-sm">
        
         <label>
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

        <label className="flex items-center gap-2 text-sm">
          Target number of questions:
          <input
            type="number"
            min={1}
            inputMode="numeric"
            className="w-14 px-2 py-1 rounded border"
            value={targetCount}
            onChange={(e) => setTargetCount(e.target.value)}
            placeholder="N/A"
            disabled={busy}
            title="Limit the number of questions to generate (optional)"
          />
        </label>

        <input
          type="file"
          accept=".pdf"
          disabled={busy}
          onChange={async (e) => {
            const f = e.target.files?.[0];
            if (!f) return;
            try {
              await generateFromPdf(f);
            } catch (err) {
              setStatusMsg({ type: "error", text: `Failed: ${err.message}` });
              setBusy(false);
            } finally {
              e.target.value = null; // reset file input
            }
          }}
          className="ml-auto"
        />
      </div>
    </div>
  );
}
