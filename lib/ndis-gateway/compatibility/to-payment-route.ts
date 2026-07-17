import type { NdisPaymentRoute } from "@prisma/client";

import type { FundingRoute } from "@/lib/ndis-gateway/domain/funding-route";

/**
 * Map canonical FundingRoute → portal NdisPaymentRoute.
 * private_pay and unknown have no portal payment route.
 */
export function fundingRouteToPaymentRoute(
  route: FundingRoute
): NdisPaymentRoute | null {
  switch (route) {
    case "self_managed":
      return "self_managed";
    case "plan_managed":
      return "plan_managed";
    case "ndia_managed":
      return "ndia_managed";
    case "private_pay":
    case "unknown":
      return null;
    default: {
      const _exhaustive: never = route;
      void _exhaustive;
      return null;
    }
  }
}
