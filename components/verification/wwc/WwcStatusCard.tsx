"use client";

import { StatusBadge } from "@/components/ui/status-badge";

export function WwcStatusCard({
  status,
  publicLabel,
  expiresAt,
  jurisdiction,
  checkType,
}: {
  status: string | null;
  publicLabel: string;
  expiresAt?: string | null;
  jurisdiction?: string;
  checkType?: string;
}) {
  return (
    <section
      className="rounded-xl border border-border bg-card p-4"
      aria-labelledby="wwc-status-heading"
    >
      <h2 id="wwc-status-heading" className="font-semibold">
        Your check status
      </h2>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span className="text-sm font-medium">Status:</span>
        {status ? (
          <StatusBadge status={status} />
        ) : (
          <span className="text-sm text-muted-foreground">Not submitted</span>
        )}
      </div>
      <p className="mt-2 text-sm">{publicLabel}</p>
      {jurisdiction && checkType ? (
        <p className="mt-1 text-sm text-muted-foreground">
          {jurisdiction} — {checkType.replace(/_/g, " ")}
        </p>
      ) : null}
      {expiresAt ? (
        <p className="mt-1 text-sm text-muted-foreground">
          Expires: {new Date(expiresAt).toLocaleDateString("en-AU")}
        </p>
      ) : null}
    </section>
  );
}
