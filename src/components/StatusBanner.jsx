export default function StatusBanner({statusMsg, busy}) {
  return (
    <div
      className={
        "flex items-center gap-2 rounded-lg border p-3 text-sm " +
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
      className="inline-block h-4 w-4 align-middle animate-spin rounded-full border-2 border-current border-t-transparent"
      aria-label="Loading"
    />
  );
}