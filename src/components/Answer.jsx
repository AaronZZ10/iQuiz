export default function Answer({ current }) {
  return (
    <div className="p-4 rounded-xl border bg-green-50">
                  <div className="text-sm uppercase tracking-wide opacity-70">
                    Answer
                  </div>
                  <div className="text-lg mt-1 font-medium">
                    {current.answer}
                  </div>
                  {current.explanation && (
                    <p className="mt-2 text-sm opacity-90">
                      {current.explanation}
                    </p>
                  )}
                </div>
  );
}
