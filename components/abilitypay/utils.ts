export function formatCents(cents: number): string {
  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
  }).format(cents / 100);
}

export function formatInvoiceStatus(status: string): string {
  const labels: Record<string, string> = {
    draft: "Draft",
    submitted: "Submitted",
    in_review: "In review",
    awaiting_participant: "Waiting for your approval",
    approved: "Approved",
    rejected: "Rejected",
    exported: "Exported",
  };
  return labels[status] ?? status;
}

export function formatPaymentStatus(status: string): string {
  const labels: Record<string, string> = {
    pending_review: "Pending review",
    approved: "Approved",
    rejected: "Rejected",
    ready_to_pay: "Ready to pay",
    processing: "Processing",
    paid: "Paid",
    failed: "Payment failed",
    refunded: "Refunded",
    paid_mock: "Paid (legacy)",
    on_hold: "On hold",
  };
  return labels[status] ?? status;
}

export function formatInvoiceSourceType(sourceType: string | null | undefined): string {
  const labels: Record<string, string> = {
    provider_upload: "Provider upload",
    care_service_log: "Care booking",
    delivery_event: "Delivery event",
    billing_invoice: "Billing invoice",
  };
  if (!sourceType) return "Manual";
  return labels[sourceType] ?? sourceType;
}
