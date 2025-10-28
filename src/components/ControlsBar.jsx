export default function ControlsBar({
  busy,
  flashMode,
  setFlashMode,
  shortMode,
  setShortMode,
  tags,
  filterTag,
  setFilterTag,
  setIdx,
  setSelectedChoice,
  setIsChoiceCorrect,
  setShow,
  setTyped,
  setShortAnswer,
  flaggedOnly,
  setFlaggedOnly,
  setDeck,
  setStatusMsg,
  deck,
  resetQuiz,
  flaggedIds,
  showConfirm,
  setShowConfirm,
  setSlidesName,
  setCanDownload
}) {
  return (
    <div className="flex flex-wrap items-center gap-4 mb-2 justify-between">
      <div>
        <label className="flex items-center gap-2 text-sm whitespace-nowrap">
          Tag:
          <select
            className="px-2 py-1 rounded border w-60"
            value={filterTag}
            onChange={(e) => {
              setFilterTag(e.target.value);
              setShortAnswer(null);
              setSelectedChoice(null);
              setIsChoiceCorrect(null);
              setShow(false);
              setTyped("");
              setIdx(0);
            }}
            disabled={busy||tags.length === 0||deck.length === 0}
          >
            {tags.map((t) => (
              <option key={t} value={t}>
                {t || "All"}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={!!flaggedOnly}
          onChange={(e) => {
            setFlaggedOnly(e.target.checked);
            setIdx(0);
          }}
          disabled={busy || flaggedIds.size === 0}
        />
        Flagged only
      </label>
      <label className="flex items-center gap-2 text-sm">
        Mode:
        <select
          className="px-2 py-1 rounded border"
          value={flashMode ? "flash" : shortMode ? "short" : "quiz"}
          onChange={(e) => {
            const val = e.target.value;
            const resetState = () => {
              setSelectedChoice(null);
              setIsChoiceCorrect(null);
              setShow(false);
              setTyped("");
            };

            if (val === "flash") {
              setFlashMode(true);
              setShortMode(false);
              resetState();
            } else if (val === "short") {
              setShortMode(true);
              setFlashMode(false);
              resetState();
            } else {
              // quiz (default)
              setFlashMode(false);
              setShortMode(false);
              resetState();
            }
          }}
          disabled={busy || deck.length === 0}
        >
          <option value="quiz">MCQ</option>
          <option value="short">Short Answer</option>
          <option value="flash">Flashcard</option>
        </select>
      </label>

      <button
        className="px-3 py-1.5 rounded-lg border text-sm"
        onClick={() => {
          resetQuiz();
        }}
        disabled={busy || deck.length === 0}
      >
        🔄 Retry
      </button>

      <button
        className="px-3 py-1.5 rounded-lg border text-sm"
        onClick={() => setShowConfirm(true)}
        disabled={busy || deck.length === 0}
      >
        🗑️ Clear
      </button>

      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white p-4 rounded-xl shadow-md w-80 text-sm">
            <p className="mb-3">Clear all questions and start fresh?</p>
            <div className="flex justify-end gap-2">
              <button
                className="px-3 py-1 rounded border bg-white hover:bg-gray-100"
                onClick={() => setShowConfirm(false)}
              >
                Cancel
              </button>
              <button
                className="px-3 py-1 rounded border bg-red-500 text-white hover:bg-red-600"
                onClick={() => {
                  setShowConfirm(false);
                  setDeck([]);
                  resetQuiz();
                  setStatusMsg(null);
                  setSlidesName(null);
                  setCanDownload(false);
                }}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
