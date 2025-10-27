export default function StatusBanner({ statusMsg, busy }) {
  return (
    <div
      className={
        "flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs " +
        (statusMsg.type === "success"
          ? "bg-green-50 border-green-200 text-green-900"
          : statusMsg.type === "error"
          ? "bg-red-50 border-red-200 text-red-900"
          : "bg-blue-50 border-blue-200 text-blue-900")
      }
    >
      {busy && <Spinner />}
      <span>{statusMsg.text}</span>
    </div>
  );
}

function Spinner() {
  return (
    <span
      className="inline-block h-5 w-5 animate-spin rounded-full border border-current border-t-transparent align-middle"
      aria-label="Loading"
    />
  );
}
