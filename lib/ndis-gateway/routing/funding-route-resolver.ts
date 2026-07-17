import type { FundingSourceType, NdisBillingRoute } from "@prisma/client";

import { fundingSourceTypeToFundingRoute } from "@/lib/ndis-gateway/compatibility/from-funding-source";
import { assertNever } from "@/lib/ndis-gateway/domain/errors";
import type { FundingRoute } from "@/lib/ndis-gateway/domain/funding-route";
import { paymentRouteToBillingRoute } from "@/lib/ndis-gateway/routing/route-policy";

export function fundingRouteToBillingRoute(
  route: FundingRoute
): NdisBillingRoute {
  switch (route) {
    case "self_managed":
      return "ndis_self_managed";
    case "plan_managed":
      return "ndis_plan_managed";
    case "ndia_managed":
      return "ndis_ndia_managed";
    case "private_pay":
      return "private_pay";
    case "unknown":
      return "unresolved";
    default:
      return assertNever(route, "Unhandled funding route");
  }
}

export function resolveBillingRouteFromFundingSourceType(
  type: FundingSourceType | null | undefined
): NdisBillingRoute {
  return fundingRouteToBillingRoute(fundingSourceTypeToFundingRoute(type));
}

/**
 * Resolve billing route from funding source type, with optional client override.
 * Override requires permission + reason (enforced by caller via flags).
 */
export function resolveBillingRoute(input: {
  fundingSourceType?: FundingSourceType | null;
  clientRequestedRoute?: NdisBillingRoute | null;
  allowClientOverride?: boolean;
  overrideReason?: string | null;
}): {
  billingRoute: NdisBillingRoute;
  overrideApplied: boolean;
  blockingIssues: string[];
} {
  const derived = resolveBillingRouteFromFundingSourceType(
    input.fundingSourceType
  );
  const blockingIssues: string[] = [];

  if (
    input.clientRequestedRoute &&
    input.clientRequestedRoute !== derived
  ) {
    if (!input.allowClientOverride) {
      blockingIssues.push(
        "CLIENT_ROUTE_OVERRIDE_FORBIDDEN: client cannot override billing route without permission."
      );
      return { billingRoute: derived, overrideApplied: false, blockingIssues };
    }
    if (!input.overrideReason?.trim()) {
      blockingIssues.push(
        "CLIENT_ROUTE_OVERRIDE_REASON_REQUIRED: override requires a reason."
      );
      return { billingRoute: derived, overrideApplied: false, blockingIssues };
    }
    return {
      billingRoute: input.clientRequestedRoute,
      overrideApplied: true,
      blockingIssues,
    };
  }

  if (derived === "unresolved") {
    blockingIssues.push(
      "FUNDING_ROUTE_UNRESOLVED: funding type is missing or not recognised."
    );
  }

  return { billingRoute: derived, overrideApplied: false, blockingIssues };
}

export { paymentRouteToBillingRoute };
