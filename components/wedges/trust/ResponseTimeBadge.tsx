import {
  formatResponseTimeHours,
  responseSlaLabel,
} from "@/lib/trust/response-sla";
import type { ProviderResponseSla } from "@/types/wedges";

export function ResponseTimeBadge({ sla }: { sla: ProviderResponseSla }) {
  const label = responseSlaLabel(sla.responseSlaStatus);
  return (
    <span
      className="inline-flex items-center rounded-full border border-border px-2.5 py-0.5 text-xs font-medium"
      aria-label={label}
    >
      {label}
    </span>
  );
}

export function StaleRequestWarning({ daysOverdue }: { daysOverdue: number }) {
  return (
    <div
      className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-100"
      role="status"
    >
      <p className="font-medium">Waiting for provider response</p>
      <p className="mt-1">
        This enquiry has been open for about {daysOverdue} day
        {daysOverdue === 1 ? "" : "s"} without a response.
      </p>
      <a href="/providers/available-now" className="mt-2 inline-block text-primary underline">
        Find other providers accepting enquiries
      </a>
    </div>
  );
}

export function ProviderEnquiryStatus({ sla }: { sla: ProviderResponseSla }) {
  return (
    <dl className="grid gap-2 text-sm sm:grid-cols-2">
      <div>
        <dt className="text-muted-foreground">Average response time</dt>
        <dd>{formatResponseTimeHours(sla.averageResponseTimeHours)}</dd>
      </div>
      {sla.responseRate != null ? (
        <div>
          <dt className="text-muted-foreground">Response rate</dt>
          <dd>{Math.round(sla.responseRate * 100)}%</dd>
        </div>
      ) : null}
      {sla.preferredContactMethod ? (
        <div>
          <dt className="text-muted-foreground">Preferred contact</dt>
          <dd>{sla.preferredContactMethod}</dd>
        </div>
      ) : null}
      {sla.staleRequestsCount > 0 ? (
        <div>
          <dt className="text-muted-foreground">Overdue enquiries</dt>
          <dd>{sla.staleRequestsCount}</dd>
        </div>
      ) : null}
    </dl>
  );
}
