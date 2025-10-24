
export default function ControlsBar({
  busy, flashMode, setFlashMode, shortMode, setShortMode,
  tags, filterTag, setFilterTag, setIdx,
  setSelectedChoice, setIsChoiceCorrect, setShow, setTyped, setShortAnswer
}) {
    return (
        <div className="flex flex-wrap items-center gap-4 mb-2 justify-start">
          <label className="flex items-center gap-2 text-sm">
            Tag:
            <select
              className="px-2 py-1 rounded border"
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
              disabled={busy}
            >
              {tags.map((t) => (
                <option key={t} value={t}>
                  {t || "All"}
                </option>
              ))}
            </select>
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={flashMode}
              onChange={(e) => {
                const v = e.target.checked;
                setFlashMode(v);
                if (v) {
                  // Ensure mutually exclusive with short-answer; reset transient state
                  setShortMode(false);
                  setSelectedChoice(null);
                  setIsChoiceCorrect(null);
                  setShow(false);
                  setTyped("");
                }
              }}
              disabled={busy}
            />
            Flashcard mode
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={shortMode}
              onChange={(e) => {
                const v = e.target.checked;
                setShortMode(v);
                if (v) {
                  // Turning on short-answer should turn off flashcard
                  setFlashMode(false);
                  setSelectedChoice(null);
                  setIsChoiceCorrect(null);
                  setShow(false);
                  setTyped("");
                }
              }}
              disabled={busy}
            />
            Short-answer mode
          </label>
        
        </div>
    );
}