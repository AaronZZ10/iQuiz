export default function UploadPDF({generateFromPdf, busy, setStatusMsg, setBusy}) {
  return (
    <div className="rounded-2xl border bg-white p-4 space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        <label>Upload PDF slides to generate questions by AI</label>
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
              // reset the file input so the same file can be re-uploaded if needed
              e.target.value = "";
            }
          }}
          className="ml-auto"
        />
      </div>
    </div>
  );
}
