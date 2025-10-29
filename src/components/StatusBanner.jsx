import { useI18n } from "../utils/i18n";

export default function StatusBanner({ statusMsg, busy }) {
  const { t } = useI18n();
  if (!statusMsg || (!statusMsg.key && !statusMsg.text)) {
    return null;
  }
  const message =
    statusMsg.text ??
    (statusMsg.key ? t(statusMsg.key, ...(statusMsg.args || [])) : "");

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
      <span>{message}</span>
    </div>
  );
}

function Spinner() {
  return (
    <span
      className="inline-block h-4 aspect-square animate-spin rounded-full border-2 border-current border-t-transparent align-middle"
      aria-label="Loading"
    />
  );
}
