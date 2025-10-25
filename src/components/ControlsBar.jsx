export default function ControlsBar({
  busy, flashMode, setFlashMode, shortMode, setShortMode,
  tags, filterTag, setFilterTag, setIdx,
  setSelectedChoice, setIsChoiceCorrect, setShow, setTyped, setShortAnswer,
  currentId, isCurrentFlagged, toggleFlag,
  flaggedOnly, setFlaggedOnly, downloadDeckJSON, deck, resetQuiz
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
          {/* Flag controls moved here */}
          <button
            className={`px-3 py-1.5 rounded-lg border text-sm ${isCurrentFlagged ? "bg-yellow-100 border-yellow-400" : "bg-white hover:bg-gray-100"}`}
            disabled={busy || !currentId}
            onClick={() => currentId && toggleFlag(currentId)}
            title={isCurrentFlagged ? "Unflag this question" : "Flag this question"}
          >
            {isCurrentFlagged ? "★ Flagged" : "☆ Flag"}
          </button>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={!!flaggedOnly}
              onChange={(e) => {
                setFlaggedOnly(e.target.checked);
                setIdx(0);
              }}
              disabled={busy}
            />
            Flagged
          </label>
          <label className="flex items-center gap-2 text-sm">
            Mode:
            <select
              className="px-2 py-1 rounded border"
              value={
                flashMode ? "flash" :
                shortMode ? "short" :
                "quiz"
              }
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
              disabled={busy}
            >
              <option value="quiz">Quiz</option>
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
              Retake
          </button>
          

          <button
            type="button"
            className="px-3 py-1.5 rounded-lg border text-sm ml-auto"
            onClick={downloadDeckJSON}
            disabled={busy || deck.length === 0}
            title="Download all questions as JSON"
          >
            Download
          </button>
          
          
        
        </div>
    );
}