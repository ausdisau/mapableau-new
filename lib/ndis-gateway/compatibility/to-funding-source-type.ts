import type { FundingSourceType } from "@prisma/client";

import type { FundingRoute } from "@/lib/ndis-gateway/domain/funding-route";

/**
 * Map canonical FundingRoute → FundingSourceType for legacy provider facades.
 * `unknown` has no FundingSourceType representation → undefined.
 */
export function fundingRouteToFundingSourceType(
  route: FundingRoute
): FundingSourceType | undefined {
  switch (route) {
    case "self_managed":
      return "ndis_self_managed";
    case "plan_managed":
      return "ndis_plan_managed";
    case "ndia_managed":
      return "ndis_agency_managed";
    case "private_pay":
      return "private_pay";
    case "unknown":
      return undefined;
    default: {
      const _exhaustive: never = route;
      void _exhaustive;
      return undefined;
    }
  }
}
