import { NdisGatewayError, assertNever } from "@/lib/ndis-gateway/domain/errors";
import {
  isRegisteredProviderActive,
  type ProviderRegistrationContext,
} from "@/lib/ndis-gateway/domain/provider";

export const FUNDING_ROUTES = [
  "self_managed",
  "plan_managed",
  "ndia_managed",
  "private_pay",
  "unknown",
] as const;

export type FundingRoute = (typeof FUNDING_ROUTES)[number];

/** Logical claim paths returned by the resolver (adapter selection is Wave 5). */
export type ClaimPathKind =
  | "ndia_direct"
  | "approved_aggregator"
  | "portal_export"
  | "manual_claim"
  | "plan_manager_invoice"
  | "self_managed_invoice"
  | "ordinary_billing";

export type ParticipantClaimContext = {
  /** Masked or presence-only signal; raw numbers must not be required here. */
  hasNdisNumber?: boolean;
};

export type ClaimPathDecision = {
  fundingRoute: FundingRoute;
  blocked: boolean;
  blockCode?: "FUNDING_ROUTE_UNKNOWN" | "FUNDING_ROUTE_BLOCKED" | "PROVIDER_NOT_REGISTERED";
  blockMessage?: string;
  requiresHumanCorrection: boolean;
  primaryKind: ClaimPathKind | null;
  allowedKinds: ClaimPathKind[];
};

const NDIA_MANAGED_KINDS: ClaimPathKind[] = [
  "ndia_direct",
  "approved_aggregator",
  "portal_export",
  "manual_claim",
];

export function isFundingRoute(value: string): value is FundingRoute {
  return (FUNDING_ROUTES as readonly string[]).includes(value);
}

/**
 * Pure resolver: funding route + registration → allowed claim paths.
 * Never maps private_pay or unknown onto NDIA-managed submission.
 */
export function resolveClaimPath(
  fundingRoute: FundingRoute,
  providerRegistration: ProviderRegistrationContext,
  _participantContext: ParticipantClaimContext = {}
): ClaimPathDecision {
  switch (fundingRoute) {
    case "ndia_managed": {
      if (!isRegisteredProviderActive(providerRegistration)) {
        return {
          fundingRoute,
          blocked: true,
          blockCode: "PROVIDER_NOT_REGISTERED",
          blockMessage:
            "NDIA-managed claims require an active registered NDIS provider.",
          requiresHumanCorrection: true,
          primaryKind: null,
          allowedKinds: [],
        };
      }
      return {
        fundingRoute,
        blocked: false,
        requiresHumanCorrection: false,
        primaryKind: "portal_export",
        allowedKinds: [...NDIA_MANAGED_KINDS],
      };
    }
    case "plan_managed":
      return {
        fundingRoute,
        blocked: false,
        requiresHumanCorrection: false,
        primaryKind: "plan_manager_invoice",
        allowedKinds: ["plan_manager_invoice"],
      };
    case "self_managed":
      return {
        fundingRoute,
        blocked: false,
        requiresHumanCorrection: false,
        primaryKind: "self_managed_invoice",
        allowedKinds: ["self_managed_invoice"],
      };
    case "private_pay":
      return {
        fundingRoute,
        blocked: false,
        requiresHumanCorrection: false,
        primaryKind: "ordinary_billing",
        allowedKinds: ["ordinary_billing"],
      };
    case "unknown":
      return {
        fundingRoute,
        blocked: true,
        blockCode: "FUNDING_ROUTE_UNKNOWN",
        blockMessage:
          "Funding type is missing or not recognised. A person must correct it before claiming.",
        requiresHumanCorrection: true,
        primaryKind: null,
        allowedKinds: [],
      };
    default:
      return assertNever(fundingRoute, "Unhandled funding route");
  }
}

/**
 * Registered-provider direct/API claiming is only for NDIA-managed funding.
 * Self-managed, plan-managed, private-pay and unknown are blocked.
 */
export function allowsRegisteredProviderDirectClaim(
  fundingRoute: FundingRoute
): boolean {
  return fundingRoute === "ndia_managed";
}

export function assertFundingAllowsProviderDirectClaim(
  fundingRoute: FundingRoute
): void {
  if (!allowsRegisteredProviderDirectClaim(fundingRoute)) {
    throw new NdisGatewayError({
      code:
        fundingRoute === "unknown"
          ? "FUNDING_ROUTE_UNKNOWN"
          : "FUNDING_ROUTE_BLOCKED",
      plainLanguageMessage:
        fundingRoute === "unknown"
          ? "Funding type must be corrected before this claim can continue."
          : "This funding type cannot be submitted as a registered-provider NDIA claim.",
      technicalMessage: `Registered provider direct claim blocked for fundingRoute=${fundingRoute}`,
    });
  }
}
