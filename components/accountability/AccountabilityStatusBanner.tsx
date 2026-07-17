import type { AccountabilityPortalStatus } from "@/lib/accountability/types";

export function AccountabilityStatusBanner({
  status,
}: {
  status: AccountabilityPortalStatus;
}) {
  return (
    <section
      aria-labelledby="accountability-status-heading"
      className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
    >
      <h2 id="accountability-status-heading" className="font-heading text-lg font-semibold">
        Accountability status
      </h2>
      <dl className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <div>
          <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Reporting period
          </dt>
          <dd className="mt-1 text-sm">{status.reportingPeriodLabel}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Latest publication
          </dt>
          <dd className="mt-1 text-sm">
            {status.latestPublicationDate
              ? new Date(status.latestPublicationDate).toLocaleDateString("en-AU")
              : "Not yet published"}
          </dd>
        </div>
        <div>
          <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Data completeness
          </dt>
          <dd className="mt-1 text-sm">
            {status.dataCompletenessPct != null
              ? `${Math.round(status.dataCompletenessPct)}%`
              : "Not available"}
          </dd>
        </div>
        <div>
          <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Major correction active
          </dt>
          <dd className="mt-1 text-sm">{status.hasMajorCorrection ? "Yes" : "No"}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Unresolved critical commitment
          </dt>
          <dd className="mt-1 text-sm">
            {status.hasUnresolvedCriticalCommitment ? "Yes" : "No"}
          </dd>
        </div>
        {status.contentSha256 ? (
          <div className="sm:col-span-2 lg:col-span-1">
            <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Snapshot checksum
            </dt>
            <dd className="mt-1 break-all font-mono text-xs">
              {status.contentSha256.slice(0, 16)}…
            </dd>
          </div>
        ) : null}
      </dl>
    </section>
  );
}
