"use client";

import { evidenceLabelText } from "@/lib/trust/trust-score";
import type { ProviderTrustScore } from "@/types/wedges";

export function TrustScoreBadge({ score }: { score: number }) {
  return (
    <span
      className="inline-flex items-center rounded-full border border-border bg-muted/50 px-2.5 py-0.5 text-sm font-medium"
      aria-label={`Trust score ${score} out of 100`}
    >
      Trust {score}/100
    </span>
  );
}

export function TrustBreakdown({ trust }: { trust: ProviderTrustScore }) {
  return (
    <section aria-labelledby="trust-breakdown-heading" className="space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        <h2 id="trust-breakdown-heading" className="font-heading text-lg font-semibold">
          Trust breakdown
        </h2>
        <TrustScoreBadge score={trust.overallScore} />
      </div>
      <p className="text-sm text-muted-foreground">{trust.summary}</p>
      <ul className="space-y-2">
        {trust.categories.map((cat) => (
          <li
            key={cat.id}
            className="flex flex-wrap items-start justify-between gap-2 rounded-lg border border-border p-3 text-sm"
          >
            <span className="font-medium">{cat.label}</span>
            <span className="text-muted-foreground">
              {evidenceLabelText(cat.evidence)}
              {cat.lastChecked
                ? ` · ${new Date(cat.lastChecked).toLocaleDateString("en-AU")}`
                : null}
            </span>
            {cat.notes ? (
              <span className="w-full text-xs text-muted-foreground">{cat.notes}</span>
            ) : null}
          </li>
        ))}
      </ul>
      <p className="text-xs text-muted-foreground" role="note">
        Trust scores are evidence-based. Paid plans do not automatically improve trust scores.
      </p>
    </section>
  );
}
