import { Badge } from "@/components/ui/badge";

const LABELS: Record<string, string> = {
  draft: "Draft",
  awaiting_participant_approval: "Awaiting your approval",
  approved: "Approved",
  issued: "Issued",
  payment_pending: "Payment pending",
  paid: "Paid",
  partially_paid: "Partially paid",
  sent_to_plan_manager: "Sent to plan manager",
  xero_sync_pending: "Accounting sync pending",
  xero_synced: "Synced to accounting",
  overdue: "Overdue",
  disputed: "Disputed",
  void: "Void",
  refunded: "Refunded",
};

export function InvoiceStatusBadge({ status }: { status: string }) {
  const label = LABELS[status] ?? status.replace(/_/g, " ");
  const variant = status === "paid" || status === "xero_synced" ? "default" : "outline";
  return (
    <Badge
      variant={variant}
      className={
        status === "disputed" || status === "overdue"
          ? "border-amber-600 text-amber-900 dark:text-amber-200"
          : undefined
      }
      aria-label={`Invoice status: ${label}`}
    >
      {label}
    </Badge>
  );
}
