import type { DecisionPoint } from "@/lib/labs/contracts";

export function ChoicePanel({
  decision,
  onChoose,
  disabled,
}: {
  decision: DecisionPoint;
  onChoose: (optionId: string) => void;
  disabled?: boolean;
}) {
  return (
    <section
      className="rounded-3xl border border-[#F8C51C]/30 bg-[#F8C51C]/10 p-5"
      aria-labelledby="decision-heading"
    >
      <h2 id="decision-heading" className="text-xl font-black">
        Decision required
      </h2>
      <p className="mt-2 leading-7 text-white/80">{decision.prompt}</p>
      <ul className="mt-4 grid gap-3" role="list">
        {decision.options.map((option) => (
          <li key={option.id}>
            <button
              type="button"
              disabled={disabled}
              aria-describedby={`opt-desc-${option.id}`}
              className="min-h-14 w-full rounded-2xl border border-white/20 bg-[#071727] px-4 py-3 text-left transition hover:border-[#F8C51C] focus:outline-none focus:ring-4 focus:ring-[#F8C51C]/40 disabled:opacity-50"
              onClick={() => onChoose(option.id)}
            >
              <span className="font-black">
                {option.label}
                {option.recommended ? (
                  <span className="ml-2 text-xs font-bold uppercase tracking-wide text-[#F8C51C]">
                    Suggested
                  </span>
                ) : null}
              </span>
              <span
                id={`opt-desc-${option.id}`}
                className="mt-1 block text-sm leading-6 text-white/65"
              >
                {option.description}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
