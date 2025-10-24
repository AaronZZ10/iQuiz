export default function UploadPDF({generateFromPdf, busy, setStatusMsg, setBusy}) {
  return (
    <div className="rounded-2xl border bg-white p-4 space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        <label>Upload slides → Get AI-generated quiz</label>
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
            } 
          }}
          className="ml-auto"
        />
      </div>
    </div>
  );
}
