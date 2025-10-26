export default function MCQ({
  current,
  shortMode,
  flashMode,
  selectedChoice,
  isChoiceCorrect,
  shortAnswerCorrect,
  busy,
  setQuizState,
  setSavedChoices,
  setShow,
}) {
  return (
    <div>
      {!shortMode && !flashMode && current.choices?.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {(() => {
            const answerNorm = norm(current.answer);
            return current.choices.map((c, i) => {
              const isChosen = selectedChoice === c;
              const isCorrect = norm(c) === answerNorm;

              let cls = "text-left p-3 rounded-xl border hover:shadow";
              if (selectedChoice !== null) {
                if (isCorrect && isChosen)
                  cls += " border-green-500 bg-green-50";
                if (!isCorrect && isChosen) cls += " border-red-500 bg-red-50";
              }

              return (
                <button
                  key={i}
                  className={cls}
                  disabled={busy}
                  onClick={(e) => {
                    e.currentTarget.blur();
                    setQuizState({
                      selectedChoice: c,
                      isChoiceCorrect: isCorrect,
                      shortAnswerCorrect,
                    });
                    if (current?.id != null) {
                      setSavedChoices((prev) => ({
                        ...prev,
                        [current.id]: { choice: c, correct: isCorrect },
                      }));
                    }
                    setShow(!isCorrect);
                  }}
                >
                  {c}
                </button>
              );
            });
          })()}
        </div>
      )}

      <div className="text-sm font-medium">
        {selectedChoice === null ? (
          <br />
        ) : isChoiceCorrect ? (
          <span className="text-green-700">✅ Correct!</span>
        ) : (
          <span className="text-red-700">
            ❌ Not quite — see the correct answer below.
          </span>
        )}
      </div>
    </div>
  );
}

const norm = (s) => (s ?? "").toString().trim().toLowerCase();
