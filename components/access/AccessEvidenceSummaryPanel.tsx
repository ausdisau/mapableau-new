import type { AccessExplorationEvidenceSummary } from "@/lib/access/experience/access-exploration-dto";
import { GAIS_EVIDENCE_STATE_LABELS } from "@/lib/gais/contracts/evidence";

function formatDate(value: string | null | undefined): string {
  if (!value) return "Not recorded";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-AU", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

export function AccessEvidenceSummaryPanel({
  evidence,
}: {
  evidence: AccessExplorationEvidenceSummary;
}) {
  return (
    <section
      className="rounded-2xl border border-slate-200 bg-[#F6FBFC] p-4"
      aria-labelledby="selected-place-evidence-heading"
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2
            id="selected-place-evidence-heading"
            className="text-lg font-black text-[#0C1833]"
          >
            Evidence
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Source, confidence and freshness stay separate from AccessFit.
          </p>
        </div>
        <span className="rounded-full border border-slate-300 bg-white px-3 py-1 text-xs font-bold text-slate-700">
          {evidence.confidenceLabel} confidence
        </span>
      </div>

      <dl className="mt-4 grid gap-2 sm:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-3">
          <dt className="text-xs font-bold uppercase tracking-wide text-slate-500">
            Evidence state
          </dt>
          <dd className="mt-1 text-sm font-semibold text-[#0C1833]">
            {GAIS_EVIDENCE_STATE_LABELS[evidence.dominantState]}
          </dd>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-3">
          <dt className="text-xs font-bold uppercase tracking-wide text-slate-500">
            Freshness
          </dt>
          <dd className="mt-1 text-sm font-semibold text-[#0C1833]">
            {evidence.freshnessLabel}
          </dd>
          <dd className="mt-1 text-xs text-slate-500">
            Last observed: {formatDate(evidence.lastObservedAt)}
          </dd>
        </div>
      </dl>

      {evidence.disputed ? (
        <p
          className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950"
          role="note"
        >
          Conflicting or disputed reports are present. Review the underlying
          evidence before relying on this information.
        </p>
      ) : null}

      {evidence.refs.length > 0 ? (
        <ul className="mt-4 space-y-2" aria-label="Evidence sources">
          {evidence.refs.map((ref, index) => (
            <li
              key={ref.id ?? `${ref.sourceType}-${index}`}
              className="rounded-xl border border-slate-200 bg-white p-3 text-sm"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <span className="font-bold text-[#0C1833]">
                  {ref.sourceLabel || GAIS_EVIDENCE_STATE_LABELS[ref.sourceType]}
                </span>
                <span className="text-xs font-semibold text-slate-600">
                  {ref.confidence == null
                    ? "Confidence not supplied"
                    : `${Math.round(ref.confidence * 100)}% confidence`}
                </span>
              </div>
              <p className="mt-1 text-xs text-slate-500">
                {GAIS_EVIDENCE_STATE_LABELS[ref.sourceType]}
                {ref.verifiedAt
                  ? ` · verified ${formatDate(ref.verifiedAt)}`
                  : ref.observedAt
                    ? ` · observed ${formatDate(ref.observedAt)}`
                    : ""}
              </p>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-4 text-sm text-slate-600">
          No source references are attached to this summary yet. Treat missing
          evidence as unknown, not inaccessible.
        </p>
      )}
    </section>
  );
}
