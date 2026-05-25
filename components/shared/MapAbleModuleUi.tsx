import { cn } from "@/app/lib/utils";
import { StatusBadge } from "@/components/ui/status-badge";

const MODULE_BADGES: Record<string, string> = {
  consent_required: "Consent required",
  consent_active: "Consent active",
  pending_review: "Pending review",
  approved: "Approved",
  declined: "Declined",
  needs_more_information: "Needs more information",
  invoice_pending: "Invoice pending",
  milestone_completed: "Milestone completed",
  document_private: "Document private",
  pending_participant_approval: "Pending approval",
  needs_information: "Needs information",
  processing: "Processing",
  paid: "Paid",
  disputed: "Disputed",
};

export function MapAbleStatusBadge({
  status,
  className,
}: {
  status: string;
  className?: string;
}) {
  const label = MODULE_BADGES[status];
  if (label) {
    return (
      <span
        className={cn(
          "inline-flex items-center rounded-full border px-3 py-1 text-sm font-medium",
          className
        )}
        role="status"
      >
        <span aria-hidden="true" className="mr-2">●</span>
        {label}
      </span>
    );
  }
  return <StatusBadge status={status} className={className} />;
}

export function MapAbleCard({
  children,
  className,
  title,
  description,
}: {
  children: React.ReactNode;
  className?: string;
  title?: string;
  description?: string;
}) {
  return (
    <section
      className={cn(
        "rounded-2xl border bg-card p-6 shadow-sm",
        className
      )}
      aria-labelledby={title ? "card-title" : undefined}
    >
      {title ? (
        <header className="mb-4">
          <h2 id="card-title" className="font-heading text-lg font-semibold">
            {title}
          </h2>
          {description ? (
            <p className="mt-1 text-sm text-muted-foreground">{description}</p>
          ) : null}
        </header>
      ) : null}
      {children}
    </section>
  );
}

export function AccessDeniedPanel({
  title = "Access not available",
  message,
  nextSteps,
}: {
  title?: string;
  message: string;
  nextSteps?: string;
}) {
  return (
    <div
      role="alert"
      className="rounded-2xl border border-amber-200 bg-amber-50 p-6 dark:border-amber-900 dark:bg-amber-950"
    >
      <h2 className="font-heading text-lg font-semibold">{title}</h2>
      <p className="mt-2 text-sm">{message}</p>
      {nextSteps ? (
        <p className="mt-3 text-sm font-medium">{nextSteps}</p>
      ) : null}
    </div>
  );
}

export function EmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-dashed p-8 text-center">
      <h3 className="font-heading text-base font-semibold">{title}</h3>
      <p className="mt-2 text-sm text-muted-foreground">{description}</p>
    </div>
  );
}

export function LoadingState({ label = "Loading" }: { label?: string }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="rounded-2xl border p-8 text-center text-muted-foreground"
    >
      {label}…
    </div>
  );
}
