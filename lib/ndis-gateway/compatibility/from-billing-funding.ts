import type { BillingFundingSourceType } from "@prisma/client";

import type { FundingRoute } from "@/lib/ndis-gateway/domain/funding-route";

/**
 * Map billing funding types → canonical FundingRoute.
 * `private_card` → private_pay. Non-NDIS types → unknown.
 * Never defaults to ndia_managed.
 */
export function billingFundingTypeToFundingRoute(
  type: BillingFundingSourceType | null | undefined
): FundingRoute {
  if (!type) return "unknown";
  switch (type) {
    case "ndis_self_managed":
      return "self_managed";
    case "ndis_plan_managed":
      return "plan_managed";
    case "private_card":
      return "private_pay";
    case "organisation_invoice":
    case "grant":
    case "other":
      return "unknown";
    default: {
      const _exhaustive: never = type;
      void _exhaustive;
      return "unknown";
    }
  }
}
