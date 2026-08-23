import { FEEDBACK_QUESTIONS } from "@/lib/labs/experiments/mobility-futures";

export function FeedbackPrompt({
  decisionPointId,
  onSubmit,
  disabled,
}: {
  decisionPointId: string;
  onSubmit: (question: string, response: string) => void;
  disabled?: boolean;
}) {
  return (
    <section
      className="rounded-3xl border border-white/10 p-5"
      aria-labelledby="feedback-heading"
    >
      <h2 id="feedback-heading" className="text-lg font-black">
        Quick reflection
      </h2>
      <p className="mt-2 text-sm text-white/65">
        Optional. Kept on this device only — not research data storage.
      </p>
      <ul className="mt-4 space-y-4">
        {FEEDBACK_QUESTIONS.map((question) => (
          <li key={question}>
            <fieldset disabled={disabled}>
              <legend className="text-sm font-bold text-white/90">{question}</legend>
              <div className="mt-2 flex flex-wrap gap-2">
                {["Yes", "No", "Not sure"].map((answer) => (
                  <button
                    key={answer}
                    type="button"
                    className="min-h-11 rounded-lg border border-white/20 px-3 text-sm font-bold hover:bg-white/10 focus:outline-none focus:ring-4 focus:ring-[#F8C51C]/40"
                    onClick={() => onSubmit(question, answer)}
                  >
                    {answer}
                  </button>
                ))}
              </div>
            </fieldset>
            <span className="sr-only">Decision point {decisionPointId}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
