import type { RecoveryOptionView } from "@/lib/continuity-os/types";

export function RecoveryOptionCard(props: {
  option: RecoveryOptionView;
  selected?: boolean;
  onSelect?: (optionId: string) => void;
  disabled?: boolean;
}) {
  const { option } = props;
  const blocked = !option.hardRequirementsMet || option.availability === "blocked";

  return (
    <article
      className={`rounded-lg border p-4 ${
        blocked
          ? "border-rose-200 bg-rose-50"
          : props.selected
            ? "border-sky-400 bg-sky-50"
            : "border-slate-200 bg-white"
      }`}
      aria-labelledby={`option-${option.id}-title`}
    >
      <h3 id={`option-${option.id}-title`} className="font-semibold text-slate-900">
        {option.title}
      </h3>
      <p className="mt-2 text-sm text-slate-700">{option.summary}</p>
      <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-slate-700">
        <li>
          Availability: <strong>{option.availability}</strong>
        </li>
        <li>
          Horizon: <strong>{option.horizon}</strong>
        </li>
        <li>
          Cost: <strong>{option.knownCost ?? "unknown"}</strong>
        </li>
        {option.excludedReason ? (
          <li>
            Excluded: <strong>{option.excludedReason}</strong>
          </li>
        ) : null}
        {option.remainingUnknowns.map((u) => (
          <li key={u}>
            Unknown: <strong>{u}</strong>
          </li>
        ))}
      </ul>
      {props.onSelect && !blocked ? (
        <button
          type="button"
          className="mt-4 rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
          disabled={props.disabled}
          onClick={() => props.onSelect?.(option.id)}
        >
          {props.selected ? "Selected" : "Approve this option for proposal"}
        </button>
      ) : null}
    </article>
  );
}
