"use client";

type AuditEvent = {
  id: string;
  action: string;
  createdAt: string | Date;
  actorUser?: { name?: string | null } | null;
  metadata?: unknown;
};

const actionLabels: Record<string, string> = {
  "coordinate.plan.uploaded": "Plan uploaded",
  "coordinate.plan.summary_approved": "Plan summary approved",
  "coordinate.goals.extracted": "Goals extracted",
  "coordinate.action.approved": "Support action approved",
  "coordinate.shortlist.generated": "Provider shortlist generated",
  "coordinate.shortlist.item_reviewed": "Provider shortlist item reviewed",
  "coordinate.review.approved": "Review task approved",
  "coordinate.review.rejected": "Review task rejected",
  "coordinate.draft.created": "Message draft created",
  "coordinate.draft.approved": "Message draft approved",
  "coordinate.budget.updated": "Budget updated",
  "coordinate.risk.flagged": "Risk flagged",
};

export function AuditTrail({ events }: { events: AuditEvent[] }) {
  if (events.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No coordinate activity recorded yet.
      </p>
    );
  }

  return (
    <ol className="space-y-3" aria-label="Activity log">
      {events.map((event) => {
        const when = new Date(event.createdAt).toLocaleString("en-AU", {
          dateStyle: "medium",
          timeStyle: "short",
        });
        const label = actionLabels[event.action] ?? event.action;

        return (
          <li
            key={event.id}
            className="rounded-lg border p-4 text-sm"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-medium">{label}</p>
              <time dateTime={new Date(event.createdAt).toISOString()}>{when}</time>
            </div>
            <p className="mt-1 text-muted-foreground">
              {event.actorUser?.name ? `By ${event.actorUser.name}` : "System event"}
            </p>
          </li>
        );
      })}
    </ol>
  );
}
