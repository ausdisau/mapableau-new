import type {
  NdisBillingRoute,
  NdisPaymentDestination,
  NdisPaymentRoute,
} from "@prisma/client";

import { assertNever } from "@/lib/ndis-gateway/domain/errors";

/** Map NdisBillingRoute → portal NdisPaymentRoute (null when not an NDIS portal route). */
export function billingRouteToPaymentRoute(
  route: NdisBillingRoute
): NdisPaymentRoute | null {
  switch (route) {
    case "ndis_self_managed":
      return "self_managed";
    case "ndis_plan_managed":
      return "plan_managed";
    case "ndis_ndia_managed":
      return "ndia_managed";
    case "private_pay":
    case "pro_bono":
    case "grant_funded":
    case "employer_funded":
    case "health_funded":
    case "other":
    case "unresolved":
      return null;
    default:
      return assertNever(route, "Unhandled billing route");
  }
}

/** Map portal NdisPaymentRoute → NdisBillingRoute. */
export function paymentRouteToBillingRoute(
  route: NdisPaymentRoute
): NdisBillingRoute {
  switch (route) {
    case "self_managed":
      return "ndis_self_managed";
    case "plan_managed":
      return "ndis_plan_managed";
    case "ndia_managed":
      return "ndis_ndia_managed";
    default:
      return assertNever(route, "Unhandled payment route");
  }
}

export function defaultPaymentDestination(
  route: NdisBillingRoute
): NdisPaymentDestination {
  switch (route) {
    case "ndis_self_managed":
      return "participant";
    case "ndis_plan_managed":
      return "plan_manager";
    case "ndis_ndia_managed":
      return "ndia_portal_export";
    case "private_pay":
      return "private_payer";
    case "pro_bono":
    case "grant_funded":
      return "no_payment";
    case "employer_funded":
    case "health_funded":
    case "other":
      return "private_payer";
    case "unresolved":
      return "unresolved";
    default:
      return assertNever(route, "Unhandled billing route for destination");
  }
}

/** Routes that may share a multi-participant NDIA batch/package. */
export function allowsMultiParticipantGrouping(
  route: NdisBillingRoute
): boolean {
  return route === "ndis_ndia_managed";
}

/** Self/plan/private invoices are one participant per invoice. */
export function requiresSingleParticipantInvoice(
  route: NdisBillingRoute
): boolean {
  return (
    route === "ndis_self_managed" ||
    route === "ndis_plan_managed" ||
    route === "private_pay"
  );
}

export function isUnresolvedBillingRoute(route: NdisBillingRoute): boolean {
  return route === "unresolved";
}

export function isNdisManagedBillingRoute(route: NdisBillingRoute): boolean {
  return (
    route === "ndis_self_managed" ||
    route === "ndis_plan_managed" ||
    route === "ndis_ndia_managed"
  );
}
