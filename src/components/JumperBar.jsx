export default function JumperBar({ visible, idx, setIdx, busy, setShow, setQuizState, jumpRef, flaggedIds }) {
    return (
                      <div className="flex items-center gap-2">
                <div
                  ref={jumpRef}
                  className="overflow-x-auto pb-3"
                  style={{ scrollbarGutter: "stable" }}
                >
                  <div className="flex flex-nowrap whitespace-nowrap gap-1 py-1">
                    {visible.map((q, i) => {
                      const isActive = i === idx;
                      const isFlagged = flaggedIds.has(q.id);
                      let cls = "px-2 py-1 text-xs rounded border shrink-0";
                      if (isActive)
                        cls +=
                          " ring-2 ring-blue-400 border-blue-400 jump-active";
                      if (isFlagged) cls += " bg-yellow-100 border-yellow-300";
                      else cls += " bg-white";

                      return (
                        <button
                          key={q.id ?? i}
                          className={cls}
                          onClick={(e) => {
                            setIdx(i);
                            setShow(false);
                            setQuizState({
                              selectedChoice: null,
                              shortAnswerCorrect: null,
                              isChoiceCorrect: null,
                            });
                            e.currentTarget.blur();
                          }}
                          title={`Go to question ${i + 1}${
                            isFlagged ? " (flagged)" : ""
                          }`}
                          disabled={busy}
                        >
                          {i + 1}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
    );
  }