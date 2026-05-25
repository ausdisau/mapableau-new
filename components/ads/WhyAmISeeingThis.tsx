"use client";

import { useId } from "react";

type WhyAmISeeingThisProps = {
  reasons: string[];
  className?: string;
};

export function WhyAmISeeingThis({ reasons, className }: WhyAmISeeingThisProps) {
  const panelId = useId();

  if (reasons.length === 0) return null;

  return (
    <details className={className}>
      <summary className="cursor-pointer text-sm text-muted-foreground underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded">
        Why am I seeing this?
      </summary>
      <div
        id={panelId}
        className="mt-2 rounded-lg border border-border/60 bg-muted/30 p-3 text-sm text-muted-foreground"
        role="region"
        aria-label="Why this sponsored result is shown"
      >
        <p className="font-medium text-foreground">This ad is shown because:</p>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          {reasons.map((reason) => (
            <li key={reason}>{reason}</li>
          ))}
        </ul>
        <p className="mt-2 text-xs">
          MapAble does not use diagnosis, NDIS plan details, clinical notes, or
          other sensitive disability data for advertising.
        </p>
      </div>
    </details>
  );
}
