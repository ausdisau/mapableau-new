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
