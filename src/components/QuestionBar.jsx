export default function QuestionBar({
  current,
  busy,
  visible,
  idx,
  filterTag,
  toggleFlag,
  isCurrentFlagged,
}) {
  return (
    <div className="flex items-center gap-2 text-xs uppercase tracking-wider opacity-70">
      <span>
        Question {idx + 1} / {visible.length}
        {filterTag ? ` (tag: ${filterTag})` : ""}
      </span>

      <button
        type="button"
        className={
          "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] border " +
          (isCurrentFlagged
            ? "bg-yellow-100 text-yellow-800 border-yellow-300"
            : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50")
        }
        onClick={() => current && toggleFlag(current.id)}
        disabled={busy || !current}
        title={isCurrentFlagged ? "Unflag this question" : "Flag this question"}
        aria-pressed={isCurrentFlagged ? "true" : "false"}
      >
        {isCurrentFlagged ? "★ Flagged" : "☆ Flag"}
      </button>
    </div>
  );
}
