import type { FundingSourceType } from "@prisma/client";

import type { NdisPaymentRoute } from "@/lib/ndis/claiming/types";
import { fundingSourceTypeToFundingRoute } from "@/lib/ndis-gateway/compatibility/from-funding-source";
import { fundingRouteToPaymentRoute } from "@/lib/ndis-gateway/compatibility/to-payment-route";

/**
 * Compatibility facade over lib/ndis-gateway funding routes.
 * Unsupported / private funding returns null (never falls through to ndia_managed).
 */
export function fundingSourceToPaymentRoute(
  type: FundingSourceType | null | undefined
): NdisPaymentRoute | null {
  return fundingRouteToPaymentRoute(fundingSourceTypeToFundingRoute(type));
}

export function paymentRouteRequiresMyProviderCheck(
  route: NdisPaymentRoute
): boolean {
  return route === "ndia_managed";
}

export function paymentRouteRequiresPlanManager(route: NdisPaymentRoute): boolean {
  return route === "plan_managed";
}

export function paymentRouteUsesBulkExport(route: NdisPaymentRoute): boolean {
  return route === "ndia_managed";
}

export function paymentRouteUsesParticipantInvoice(
  route: NdisPaymentRoute
): boolean {
  return route === "self_managed";
}

export function paymentRouteUsesPlanManagerInvoice(
  route: NdisPaymentRoute
): boolean {
  return route === "plan_managed";
}
