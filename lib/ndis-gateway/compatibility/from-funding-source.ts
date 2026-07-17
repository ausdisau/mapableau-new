import type { FundingSourceType } from "@prisma/client";

import type { FundingRoute } from "@/lib/ndis-gateway/domain/funding-route";

/**
 * Map participant FundingSourceType → canonical FundingRoute.
 * Unsupported types become `unknown` — never `ndia_managed`.
 */
export function fundingSourceTypeToFundingRoute(
  type: FundingSourceType | null | undefined
): FundingRoute {
  if (!type) return "unknown";
  switch (type) {
    case "ndis_self_managed":
      return "self_managed";
    case "ndis_plan_managed":
      return "plan_managed";
    case "ndis_agency_managed":
      return "ndia_managed";
    case "private_pay":
      return "private_pay";
    case "aged_care":
    case "employer":
    case "other":
      return "unknown";
    default: {
      const _exhaustive: never = type;
      void _exhaustive;
      return "unknown";
    }
  }
}
