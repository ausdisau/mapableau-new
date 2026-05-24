const LABELS: Record<string, string> = {
  draft: "Draft",
  submitted: "Submitted",
  awaiting_admin_review: "Awaiting admin review",
  awaiting_provider_response: "Awaiting provider",
  confirmed: "Confirmed",
  scheduled: "Scheduled",
  approved: "Approved",
  published: "Published",
  requested: "Requested",
  quote_requested: "Quote requested",
  quoted: "Quoted",
  participant_confirmed: "Confirmed",
  provider_accepted: "Provider accepted",
  vehicle_dispatched: "Vehicle dispatched",
  arrived_at_pickup: "At pickup",
  passenger_onboard: "On board",
  late_risk: "May be late",
  no_show: "No show",
  access_issue: "Access issue",
  incident_reported: "Incident",
  invoiced: "Invoiced",
  paid: "Paid",
};

export function StatusTextBadge({ status }: { status: string }) {
  const label = LABELS[status] ?? status.replace(/_/g, " ");
  return (
    <span className="inline-flex min-h-8 items-center rounded-md border border-border bg-muted px-2 text-sm font-medium capitalize">
      <span className="sr-only">Status: </span>
      {label}
    </span>
  );
}
