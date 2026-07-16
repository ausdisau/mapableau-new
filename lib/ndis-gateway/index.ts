/** Canonical NDIS gateway domain — Waves 1–4. */

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

export {
  createClaimSnapshot,
  getClaimSnapshotSafe,
  loadExternalPayloadForSubmission,
  supersedeClaimSnapshot,
} from "@/lib/ndis-gateway/security/claim-snapshot-service";
export {
  approveClaimSnapshot,
  getSubmissionApproval,
  rejectClaimSnapshot,
  revokeClaimApproval,
  pilotApprovalIsNotClaimAuthority,
} from "@/lib/ndis-gateway/security/claim-approval-service";
export { sanitiseForLog, sanitiseAuditJson } from "@/lib/ndis-gateway/security/log-sanitiser";
export {
  hashCanonicalClaimIdentity,
  toMaskedClaimPayload,
  payloadContainsRawNdisNumber,
} from "@/lib/ndis-gateway/security/sensitive-payload";

/* Wave 4 — pricing bridge */
export { resolvePriceForServiceDate } from "@/lib/ndis-gateway/pricing/price-resolution-bridge";
export type {
  PriceResolutionResult,
  ResolvePriceForServiceDateInput,
  AllowZeroPriceReason,
} from "@/lib/ndis-gateway/pricing/price-resolution-types";
export { PRICE_RESOLVER_VERSION } from "@/lib/ndis-gateway/pricing/price-resolution-types";

/* Wave 4 — billing */
export {
  multiplyQuantityCents,
  assertPositiveCents,
  sumCents,
} from "@/lib/ndis-gateway/billing/money";
export { buildBillableSourceKey } from "@/lib/ndis-gateway/billing/source-key";
export { validateBillableItemDraft } from "@/lib/ndis-gateway/billing/billable-item-validator";
export { findDuplicateBySourceKey } from "@/lib/ndis-gateway/billing/billable-item-deduplication";
export { createBillableItemsFromService } from "@/lib/ndis-gateway/billing/service-to-billable-item";
export {
  getBillableItemSafe,
  listBillableItemsSafe,
  projectBillableItemSafe,
} from "@/lib/ndis-gateway/billing/billable-item-service";
export { lockBillableItem } from "@/lib/ndis-gateway/billing/billable-item-lock";
export { createReplacementBillableItem } from "@/lib/ndis-gateway/billing/billable-item-correction";
export { evaluateBatchPolicy } from "@/lib/ndis-gateway/billing/batch-policy";
export { groupBillableItemsForBatching } from "@/lib/ndis-gateway/billing/batch-grouping";
export { createBillingBatch } from "@/lib/ndis-gateway/billing/batch-service";
export { raiseBillingDispute, transitionBillingDispute } from "@/lib/ndis-gateway/billing/dispute-service";

/* Wave 4 — evidence */
export { createDraftEvidencePackage, recordProviderException } from "@/lib/ndis-gateway/evidence/evidence-package-service";
export { confirmEvidenceByParticipant } from "@/lib/ndis-gateway/evidence/participant-confirmation-service";
export { validateEvidencePackage } from "@/lib/ndis-gateway/evidence/evidence-validator";
export { projectEvidencePackageSafe } from "@/lib/ndis-gateway/evidence/evidence-projection";

/* Wave 4 — routing */
export {
  billingRouteToPaymentRoute,
  paymentRouteToBillingRoute,
  allowsMultiParticipantGrouping,
  requiresSingleParticipantInvoice,
} from "@/lib/ndis-gateway/routing/route-policy";
export {
  resolveBillingRoute,
  resolveBillingRouteFromFundingSourceType,
} from "@/lib/ndis-gateway/routing/funding-route-resolver";
export { resolvePaymentDestination } from "@/lib/ndis-gateway/routing/payment-destination-resolver";
export {
  decideAndPersistBillingRoute,
  resolveBillingRouteForOrganisation,
} from "@/lib/ndis-gateway/routing/route-decision-service";

/* Wave 4 — documents */
export {
  allocateDocumentNumber,
  allocateBatchReference,
  australianFinancialYear,
  formatDocumentNumber,
  prefixForDocumentKind,
} from "@/lib/ndis-gateway/documents/document-number-service";
export { createDocumentPackage } from "@/lib/ndis-gateway/documents/document-package-service";
export { checksumDocumentContent, checksumJson } from "@/lib/ndis-gateway/documents/document-checksum";

/* Wave 4 — workflows */
export {
  assertBillableItemTransition,
  canTransitionBillableItemStatus,
  FORBIDDEN_BILLABLE_TRANSITIONS,
} from "@/lib/ndis-gateway/workflows/billable-item-state-machine";
export { preparePaymentForBillableItems } from "@/lib/ndis-gateway/workflows/prepare-payment-workflow";
export { generateRouteDocument } from "@/lib/ndis-gateway/workflows/generate-route-document";
export { lockBillingPackage } from "@/lib/ndis-gateway/workflows/lock-billing-package";
export { correctPaymentWorkflow } from "@/lib/ndis-gateway/workflows/correct-payment-workflow";
export { voidPaymentWorkflow } from "@/lib/ndis-gateway/workflows/void-payment-workflow";
