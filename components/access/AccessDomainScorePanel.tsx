"use client";

type DomainSummary = {
  domain: string;
  score: number | null;
  sampleCount: number;
};

const DOMAIN_LABELS: Record<string, string> = {
  mobility: "Mobility access",
  sensory: "Sensory access",
  communication: "Communication access",
  cognitive: "Cognitive access",
  service: "Service and staff access",
};

export function AccessDomainScorePanel({
  summary,
  domains,
}: {
  summary: {
    overallScore: number | null;
    confidenceScore: number | null;
    lastUpdated: string | null;
  };
  domains: DomainSummary[];
}) {
  return (
    <section aria-labelledby="access-scores-heading">
      <h2 id="access-scores-heading" className="text-lg font-semibold">
        Access scores
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Community-reported scores. Not legal certification.
      </p>

      {summary.overallScore != null ? (
        <p className="mt-3 text-2xl font-bold" aria-live="polite">
          Overall: {Math.round(summary.overallScore)}%
        </p>
      ) : (
        <p className="mt-3 text-sm text-muted-foreground">
          Not enough community reports yet for an overall score.
        </p>
      )}

      {summary.confidenceScore != null ? (
        <p className="text-sm">
          Confidence: {summary.confidenceScore}%
          {summary.lastUpdated
            ? ` · Last updated ${new Date(summary.lastUpdated).toLocaleDateString()}`
            : null}
        </p>
      ) : null}

      <ul className="mt-4 space-y-3" aria-label="Access domain scores">
        {domains.map((d) => (
          <li key={d.domain}>
            <div className="flex items-center justify-between gap-2 text-sm">
              <span>{DOMAIN_LABELS[d.domain] ?? d.domain}</span>
              <span>
                {d.score != null ? `${Math.round(d.score)}%` : "Not enough data"}
              </span>
            </div>
            <div
              className="mt-1 h-3 overflow-hidden rounded-full bg-muted"
              role="meter"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={d.score ?? 0}
              aria-label={`${DOMAIN_LABELS[d.domain] ?? d.domain} score`}
            >
              <div
                className="h-full bg-primary"
                style={{ width: `${d.score ?? 0}%` }}
              />
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
