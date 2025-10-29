import {useI18n} from '../utils/i18n';

export default function Nav({setIdx, idx, visible, busy, setTyped, setShow, setShortAnswer, setSelectedChoice, setIsChoiceCorrect}) {
  const {t} = useI18n();
    return (
        <div className="flex items-center justify-between gap-3">
                <button
                  className="px-3 py-2 rounded-lg border bg-white hover:bg-gray-100 disabled:opacity-50"
                  onClick={() => {
                    setIdx((i) => Math.max(0, i - 1));
                    setShow(false);
                    setTyped("");
                    setShortAnswer(null);
                    setSelectedChoice(null);
                    setIsChoiceCorrect(null);
                  }}
                  disabled={busy || idx === 0}
                >
                  {t("previous")}
                </button>

                <button
                  className="px-3 py-2 rounded-lg border bg-white hover:bg-gray-100 disabled:opacity-50"
                  onClick={() => {
                    setIdx((i) => Math.min(i + 1, visible.length - 1));
                    setShow(false);
                    setTyped("");
                    setShortAnswer(null);
                    setSelectedChoice(null);
                    setIsChoiceCorrect(null);
                  }}
                  disabled={busy || idx >= visible.length - 1}
                >
                  {t("next")}
                </button>
              </div>
    );
}