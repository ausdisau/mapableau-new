import React from "react";
import { AlertTriangle, ShieldCheck } from "lucide-react";

import { cn } from "@/app/lib/utils";
import type { ProviderVerificationLabel } from "@/types/provider-profile";

type ProviderVerificationPanelProps = {
  label: ProviderVerificationLabel;
  display: string;
  ndisRegistered: boolean;
  ndisNumber?: string;
  showWarning: boolean;
};

const POSITIVE_LABELS: ProviderVerificationLabel[] = [
  "mapable_reviewed",
  "ndis_registered",
];

export function ProviderVerificationPanel({
  label,
  display,
  ndisRegistered,
  ndisNumber,
  showWarning,
}: ProviderVerificationPanelProps) {
  const isPositive = POSITIVE_LABELS.includes(label);

  return (
    <section
      aria-labelledby="verification-heading"
      className={cn(
        "rounded-xl border p-4 sm:p-5",
        showWarning
          ? "border-amber-500/40 bg-amber-500/5"
          : "border-primary/25 bg-primary/5",
      )}
    >
      <h2 id="verification-heading" className="sr-only">
        Verification status
      </h2>
      <div className="flex flex-wrap items-start gap-3">
        {isPositive ? (
          <ShieldCheck
            className="h-5 w-5 shrink-0 text-primary"
            aria-hidden
          />
        ) : (
          <AlertTriangle
            className="h-5 w-5 shrink-0 text-amber-700 dark:text-amber-400"
            aria-hidden
          />
        )}
        <div className="min-w-0 space-y-2">
          <p className="text-sm font-semibold text-foreground">
            Status:{" "}
            <span className="font-bold">{display}</span>
            {ndisRegistered ? (
              <span className="ml-1 text-muted-foreground font-normal">
                (NDIS provider register)
              </span>
            ) : null}
          </p>
          {ndisNumber ? (
            <p className="text-xs text-muted-foreground">
              NDIS registration reference on file where supplied by the provider.
            </p>
          ) : null}
          {showWarning ? (
            <p className="text-sm leading-relaxed text-muted-foreground">
              MapAble does not endorse this listing unless it is marked{" "}
              <strong className="font-semibold text-foreground">
                MapAble reviewed
              </strong>{" "}
              or{" "}
              <strong className="font-semibold text-foreground">
                NDIS registered
              </strong>
              . Always confirm services, qualifications and suitability before
              booking.
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">
              This provider has completed MapAble or NDIS checks we display here.
              You should still confirm details that matter for your support needs.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
