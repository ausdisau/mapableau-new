import { StatusBadge } from "@/components/ui/status-badge";

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
};

export function StatusTextBadge({ status }: { status: string }) {
  return (
    <StatusBadge
      status={status}
      label={LABELS[status] ?? status.replace(/_/g, " ")}
      className="normal-case"
    />
  );
}
