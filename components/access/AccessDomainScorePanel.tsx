"use client";

import type { AccessDomain } from "@prisma/client";

import { DOMAIN_LABELS } from "@/lib/access-reports/access-domain-config";

export type DomainScoreData = {
  domain: AccessDomain;
  score: number | null;
  confidenceScore: number | null;
  sampleCount: number;
};

export function AccessDomainScorePanel({
  overallScore,
  confidenceScore,
  lastUpdated,
  domains,
}: {
  overallScore: number | null;
  confidenceScore: number | null;
  lastUpdated: string | null;
  domains: DomainScoreData[];
}) {
  return (
    <section aria-labelledby="access-scores-heading" className="space-y-4">
      <h2 id="access-scores-heading" className="text-lg font-semibold">
        Access scores
      </h2>
      <p className="text-sm text-muted-foreground">
        Community-reported scores. Not a legal or compliance certification.
      </p>

      {overallScore != null ? (
        <div
          className="rounded-lg border border-border bg-muted/30 p-4"
          aria-label={`Overall access score ${overallScore} out of 5`}
        >
          <p className="text-sm text-muted-foreground">Overall access score</p>
          <p className="text-3xl font-bold">{overallScore.toFixed(1)}</p>
          <p className="text-sm">out of 5</p>
          {confidenceScore != null ? (
            <p className="mt-1 text-sm text-muted-foreground">
              Confidence: {Math.round(confidenceScore * 100)}%
            </p>
          ) : null}
          {lastUpdated ? (
            <p className="mt-1 text-xs text-muted-foreground">
              Last updated:{" "}
              {new Date(lastUpdated).toLocaleDateString("en-AU", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </p>
          ) : null}
        </div>
      ) : (
        <p className="text-sm">Not enough community reports yet.</p>
      )}

      <ul className="grid gap-3 sm:grid-cols-2" aria-label="Domain access scores">
        {domains.map((d) => (
          <li
            key={d.domain}
            className="rounded-lg border border-border p-3"
            aria-label={`${DOMAIN_LABELS[d.domain]}: ${
              d.score != null ? `${d.score.toFixed(1)} out of 5` : "No data yet"
            }`}
          >
            <p className="text-sm font-medium">{DOMAIN_LABELS[d.domain]}</p>
            <p className="text-xl font-semibold">
              {d.score != null ? d.score.toFixed(1) : "—"}
            </p>
            {d.sampleCount > 0 ? (
              <p className="text-xs text-muted-foreground">
                Based on {d.sampleCount} report{d.sampleCount === 1 ? "" : "s"}
              </p>
            ) : (
              <p className="text-xs text-muted-foreground">No reports yet</p>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
