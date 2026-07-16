type Props = {
  optionKey: string;
  label: string;
  description: string;
  availabilityState: string;
  preservesOriginalGoal: boolean;
  hardRequirementsMet: boolean;
  costSummary?: string;
  excludedReason?: string | null;
  selected?: boolean;
  onSelect?: () => void;
};

export function RecoveryOptionCard({
  label,
  description,
  availabilityState,
  preservesOriginalGoal,
  hardRequirementsMet,
  costSummary,
  excludedReason,
  selected,
  onSelect,
}: Props) {
  const excluded = availabilityState === "blocked" || !hardRequirementsMet;
  return (
    <article
      className={`rounded-lg border p-4 ${
        selected ? "border-slate-900 bg-slate-50" : "border-slate-200 bg-white"
      }`}
    >
      <h3 className="text-base font-semibold text-slate-900">{label}</h3>
      <p className="mt-2 text-sm text-slate-700">{description}</p>
      <dl className="mt-3 grid gap-1 text-sm text-slate-700">
        <div>
          <dt className="inline font-medium">Availability: </dt>
          <dd className="inline">{availabilityState}</dd>
        </div>
        <div>
          <dt className="inline font-medium">Original goal: </dt>
          <dd className="inline">
            {preservesOriginalGoal ? "preserved" : "changed"}
          </dd>
        </div>
        <div>
          <dt className="inline font-medium">Hard requirements: </dt>
          <dd className="inline">{hardRequirementsMet ? "met" : "failed"}</dd>
        </div>
        {costSummary ? (
          <div>
            <dt className="inline font-medium">Cost: </dt>
            <dd className="inline">{costSummary}</dd>
          </div>
        ) : null}
        {excludedReason ? (
          <div>
            <dt className="inline font-medium">Excluded: </dt>
            <dd className="inline">{excludedReason}</dd>
          </div>
        ) : null}
      </dl>
      <p className="mt-2 text-xs text-slate-500">
        A request is not a confirmed ride. A proposal is not an assigned worker.
      </p>
      {onSelect && !excluded ? (
        <button
          type="button"
          onClick={onSelect}
          className="mt-3 rounded bg-slate-900 px-3 py-2 text-sm font-medium text-white focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-slate-900"
        >
          {selected ? "Selected" : "Select option"}
        </button>
      ) : null}
    </article>
  );
}
