import { getUserOrganisationIds } from "@/lib/api/phase3-scope";
import type { CurrentUser } from "@/lib/auth/current-user";
import { isAdminRole } from "@/lib/auth/roles";
import { jsonNdisError } from "@/lib/ndis-gateway/security/http";

/**
 * Resolve the organisation the actor may operate on.
 * Prefer explicit organisationId when provided and authorised.
 */
export async function resolveProviderOrganisationId(
  user: CurrentUser,
  requestedOrganisationId?: string | null
): Promise<string | Response> {
  if (isAdminRole(user.primaryRole) && requestedOrganisationId) {
    return requestedOrganisationId;
  }

  const orgIds = await getUserOrganisationIds(user.id);
  if (requestedOrganisationId) {
    if (!orgIds.includes(requestedOrganisationId) && !isAdminRole(user.primaryRole)) {
      return jsonNdisError("Organisation access denied", 403);
    }
    return requestedOrganisationId;
  }

  const primary = orgIds[0];
  if (!primary) {
    return jsonNdisError(
      "Link your account to a provider organisation to continue.",
      403
    );
  }
  return primary;
}

export function mapBillingServiceError(error: unknown): Response | null {
  if (!(error instanceof Error)) return null;
  const msg = error.message;

  const notFound = [
    "BILLABLE_ITEM_NOT_FOUND",
    "BILLABLE_ITEMS_NOT_FOUND",
    "EVIDENCE_PACKAGE_NOT_FOUND",
    "DISPUTE_NOT_FOUND",
    "ORGANISATION_NOT_FOUND",
    "BOOKING_NOT_FOUND",
    "DOCUMENT_NOT_FOUND",
    "BATCH_NOT_FOUND",
  ];
  if (notFound.some((c) => msg === c || msg.startsWith(`${c}:`))) {
    return jsonNdisError("Not found", 404);
  }

  const forbidden = ["FORBIDDEN", "DISPUTE_PARTICIPANT_MISMATCH", "BOOKING_ORG_MISMATCH"];
  if (forbidden.some((c) => msg === c || msg.startsWith(`${c}:`))) {
    return jsonNdisError("Forbidden", 403);
  }

  const badRequestPrefixes = [
    "BOOKING_NOT_COMPLETED",
    "BILLABLE_ITEM_NOT_LOCKABLE",
    "BILLABLE_ITEM_PAYMENT_HOLD",
    "BILLABLE_ITEM_NOT_CORRECTABLE",
    "CORRECTION_REASON_REQUIRED",
    "VOID_REASON_REQUIRED",
    "PENDING_CODE_REFUSED",
    "ZERO_PRICE_REFUSED",
    "PROVIDER_EXCEPTION_REASON_REQUIRED",
    "PROVIDER_EXCEPTION_NOT_PARTICIPANT_CONFIRMATION",
    "INVALID_CONFIRMATION_METHOD",
    "EVIDENCE_INVALID",
    "DISPUTE_DESCRIPTION_REQUIRED",
    "DOCUMENT_SINGLE_PARTICIPANT_REQUIRED",
    "CREDIT_NOTE_REASON_REQUIRED",
    "CREDIT_NOTE_LINES_REQUIRED",
    "MANUAL_SUBMISSION_REFERENCE_REQUIRED",
  ];
  if (badRequestPrefixes.some((c) => msg === c || msg.startsWith(`${c}:`))) {
    return jsonNdisError("Request could not be completed", 400);
  }

  return null;
}
