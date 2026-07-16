import type {
  NdisBillingRoute,
  NdisPaymentDestination,
} from "@prisma/client";

import {
  isRegisteredProviderActive,
  type ProviderRegistrationContext,
} from "@/lib/ndis-gateway/domain/provider";
import { defaultPaymentDestination } from "@/lib/ndis-gateway/routing/route-policy";

export type PaymentDestinationDecision = {
  destination: NdisPaymentDestination;
  blocked: boolean;
  blockCodes: string[];
};

/**
 * Resolve payment destination. Unregistered providers are blocked from ndis_ndia_managed.
 * Unresolved routes block.
 */
export function resolvePaymentDestination(input: {
  billingRoute: NdisBillingRoute;
  providerRegistration: ProviderRegistrationContext;
}): PaymentDestinationDecision {
  const blockCodes: string[] = [];

  if (input.billingRoute === "unresolved") {
    return {
      destination: "unresolved",
      blocked: true,
      blockCodes: ["BILLING_ROUTE_UNRESOLVED"],
    };
  }

  if (input.billingRoute === "ndis_ndia_managed") {
    if (!isRegisteredProviderActive(input.providerRegistration)) {
      blockCodes.push("PROVIDER_NOT_REGISTERED_FOR_NDIA");
      return {
        destination: "unresolved",
        blocked: true,
        blockCodes,
      };
    }
  }

  return {
    destination: defaultPaymentDestination(input.billingRoute),
    blocked: false,
    blockCodes,
  };
}
