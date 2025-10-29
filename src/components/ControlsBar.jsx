import { useI18n } from "../utils/i18n";

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
  setCanDownload,
}) {
  const { t } = useI18n();
  return (
    <div className="flex flex-wrap items-center gap-4 mb-2 justify-between">
      <div>
        <label className="flex items-center gap-2 text-sm whitespace-nowrap">
          {t("tagLabel")}
          <select
            className="px-2 py-1 rounded border w-40"
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
            disabled={busy || tags.length === 0 || deck.length === 0}
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
        {t("flaggedOnly")}
      </label>
      <label className="flex items-center gap-2 text-sm">
        {t("modeLabel")}
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
          <option value="quiz">{t("modeQuiz")}</option>
          <option value="short">{t("modeShort")}</option>
          <option value="flash">{t("modeFlash")}</option>
        </select>
      </label>

      <button
        className="px-3 py-1.5 rounded-lg border text-sm"
        onClick={() => {
          resetQuiz();
        }}
        disabled={busy || deck.length === 0}
      >
        {"🔄 " + t("retry")}
      </button>

      <button
        className="px-3 py-1.5 rounded-lg border text-sm"
        onClick={() => setShowConfirm(true)}
        disabled={busy || deck.length === 0}
      >
        {"🗑️ " + t("clear")}
      </button>

      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white p-4 rounded-xl shadow-md w-80 text-sm">
            <p className="mb-3">{t("confirmClearTitle")}</p>
            <div className="flex justify-end gap-2">
              <button
                className="px-3 py-1 rounded border bg-white hover:bg-gray-100"
                onClick={() => setShowConfirm(false)}
              >
                {t("cancel")}
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
                {t("confirm")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
