import React from "react";
import Link from "next/link";

import type { ParticipantAccessibilitySummary } from "@/types/participant-dashboard";

type AccessibilityProfileSummaryProps = {
  summary: ParticipantAccessibilitySummary;
};

export function AccessibilityProfileSummary({
  summary,
}: AccessibilityProfileSummaryProps) {
  return (
    <section aria-labelledby="accessibility-heading" className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <h2
          id="accessibility-heading"
          className="font-heading text-lg font-semibold text-foreground"
        >
          Accessibility profile
        </h2>
        <Link
          href="/dashboard/accessibility/edit"
          className="text-sm font-medium text-primary underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          Edit
        </Link>
      </div>
      <div className="rounded-xl border border-border/60 bg-card p-4">
        <p className="text-sm leading-relaxed text-muted-foreground">
          {summary.summaryText}
        </p>
        {summary.hasProfile ? (
          <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
            <div>
              <dt className="text-muted-foreground">Mobility items</dt>
              <dd className="font-medium text-foreground">
                {summary.mobilityCount}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Communication items</dt>
              <dd className="font-medium text-foreground">
                {summary.communicationCount}
              </dd>
            </div>
          </dl>
        ) : null}
      </div>
    </section>
  );
}
