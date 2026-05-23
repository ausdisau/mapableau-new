import type { MatchReason, MatchWarning } from "@/types/support-workers";

export function MatchReasonList({
  reasons,
  warnings,
}: {
  reasons: MatchReason[];
  warnings: MatchWarning[];
}) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold">Why this match</h3>
        <ul className="mt-2 space-y-2" role="list">
          {reasons.map((r) => (
            <li key={r.code} className="text-sm">
              <span className="font-medium">{r.label}: </span>
              <span>{r.plainLanguageExplanation}</span>
              <span className="sr-only">
                Score contribution {Math.round((r.score ?? 0) * (r.weight ?? 0))}{" "}
                points
              </span>
            </li>
          ))}
        </ul>
      </div>
      {warnings.length > 0 && (
        <div role="region" aria-label="Match warnings">
          <h3 className="text-sm font-semibold">Please review</h3>
          <ul className="mt-2 space-y-2" role="list">
            {warnings.map((w) => (
              <li key={w.code} role="note" className="text-sm">
                <span className="font-medium">{w.iconLabel}: </span>
                <span>{w.plainLanguageExplanation}</span>
                <span className="sr-only">
                  Severity: {w.severity === "caution" ? "caution" : "information"}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
