import type { NdisConsentScope } from "@prisma/client";

export const NDIS_SCOPE_LABELS: Record<NdisConsentScope, string> = {
  plan_dates: "Plan start and end dates",
  plan_goals: "Plan goals",
  budget_summary: "Budget summary",
  funded_supports: "Funded supports",
  provider_relationships: "Provider relationships",
  service_booking_refs: "Service booking references",
  claim_status: "Claim status",
  payment_status: "Payment status",
};

export function describeScope(scope: NdisConsentScope): string {
  return NDIS_SCOPE_LABELS[scope];
}
