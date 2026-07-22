/** Canonical NDIS gateway domain — Wave 1. */

export type { CanonicalNdisClaim, CanonicalClaimLine } from "@/lib/ndis-gateway/domain/claim";
export {
  CANONICAL_CLAIM_STATUSES,
  assertCanTransition,
  canTransitionClaimStatus,
  isCanonicalClaimStatus,
  type CanonicalClaimStatus,
} from "@/lib/ndis-gateway/domain/claim-status";
export {
  FUNDING_ROUTES,
  allowsRegisteredProviderDirectClaim,
  assertFundingAllowsProviderDirectClaim,
  isFundingRoute,
  resolveClaimPath,
  type ClaimPathDecision,
  type ClaimPathKind,
  type FundingRoute,
  type ParticipantClaimContext,
} from "@/lib/ndis-gateway/domain/funding-route";
export {
  NdisGatewayError,
  type NdisGatewayErrorCode,
} from "@/lib/ndis-gateway/domain/errors";
export type { ProviderRegistrationContext } from "@/lib/ndis-gateway/domain/provider";
export { isRegisteredProviderActive } from "@/lib/ndis-gateway/domain/provider";
export type {
  AdapterKind,
  AdapterReadiness,
  ExternalClaimEvent,
  ExternalClaimStatus,
  ExternalResponseInput,
  NdisClaimSubmissionAdapter,
  PreparedSubmission,
  SubmissionContext,
  SubmissionReceipt,
} from "@/lib/ndis-gateway/adapters/contracts";
export { createCorrelationId } from "@/lib/ndis-gateway/infrastructure/correlation";
export {
  canonicalClaimStatusSchema,
  canonicalNdisClaimSchema,
  fundingRouteSchema,
} from "@/lib/ndis-gateway/schemas/claim.schema";
export { fundingSourceTypeToFundingRoute } from "@/lib/ndis-gateway/compatibility/from-funding-source";
export { billingFundingTypeToFundingRoute } from "@/lib/ndis-gateway/compatibility/from-billing-funding";
export { fundingRouteToPaymentRoute } from "@/lib/ndis-gateway/compatibility/to-payment-route";
export { fundingRouteToFundingSourceType } from "@/lib/ndis-gateway/compatibility/to-funding-source-type";
