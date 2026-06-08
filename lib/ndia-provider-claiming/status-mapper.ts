const STATUS_MAP: Record<string, string> = {
  submitted: "submitted",
  submitted_mock: "submitted",
  pending: "submitted",
  processing: "submitted",
  accepted: "accepted",
  approved: "accepted",
  paid: "paid",
  payment_complete: "paid",
  rejected: "rejected",
  declined: "rejected",
  failed: "failed",
  error: "failed",
};

export function mapExternalStatusToClaimStatus(
  externalStatus: string
): "submitted" | "accepted" | "rejected" | "paid" | "failed" {
  const key = externalStatus.toLowerCase().replace(/\s+/g, "_");
  const mapped = STATUS_MAP[key];
  if (
    mapped === "accepted" ||
    mapped === "rejected" ||
    mapped === "paid" ||
    mapped === "failed"
  ) {
    return mapped;
  }
  return "submitted";
}
