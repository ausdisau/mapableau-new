/**
 * Stage 1 exact-purpose require-gate. Legacy `requireConsent` is unchanged.
 *
 * When MAPABLE_ACS_EXACT_CONSENT_ENABLED is true, purpose and requested fields
 * are matched against ConsentRecord. When the flag is off, the exact gate is
 * skipped (logged) and subject/scope/recipient matching is used instead.
 */
import { createAuditEvent } from "@/lib/audit/audit-event-service";
import {
  ACS_EXACT_CONSENT_SKIPPED_LOG,
  isAcsExactConsentEnabled,
} from "@/lib/config/autonomy-care";
import { checkConsent } from "@/lib/consent/consent-service";
import { checkExactPurposeConsent } from "@/lib/consent/exact-purpose-check";
import type { ConsentScope } from "@/types/mapable";

export async function requireExactConsent(params: {
  subjectUserId: string;
  scope: ConsentScope;
  purpose: string;
  grantedToUserId?: string;
  grantedToOrganisationId?: string;
  requestedFields?: string[];
  actorUserId: string;
}): Promise<void> {
  if (!params.purpose.trim()) {
    await auditBlocked(params, "Exact purpose is required");
    throw new Error("CONSENT_REQUIRED");
  }

  if (!isAcsExactConsentEnabled()) {
    console.info(ACS_EXACT_CONSENT_SKIPPED_LOG);
    const allowed = await checkConsent({
      subjectUserId: params.subjectUserId,
      scope: params.scope,
      grantedToUserId: params.grantedToUserId,
      grantedToOrganisationId: params.grantedToOrganisationId,
    });
    if (!allowed) {
      await auditBlocked(params, "Legacy consent check denied");
      throw new Error("CONSENT_REQUIRED");
    }
    return;
  }

  const result = await checkExactPurposeConsent({
    subjectUserId: params.subjectUserId,
    scope: params.scope,
    purpose: params.purpose,
    grantedToUserId: params.grantedToUserId,
    grantedToOrganisationId: params.grantedToOrganisationId,
    requestedFields: params.requestedFields,
  });

  if (!result.allowed) {
    await auditBlocked(params, result.reason);
    throw new Error("CONSENT_REQUIRED");
  }
}

async function auditBlocked(
  params: {
    actorUserId: string;
    subjectUserId: string;
    scope: ConsentScope;
    purpose: string;
    grantedToOrganisationId?: string;
    requestedFields?: string[];
  },
  reason: string,
): Promise<void> {
  await createAuditEvent({
    actorUserId: params.actorUserId,
    action: "consent.share_blocked",
    entityType: "ConsentRecord",
    entityId: "blocked",
    participantId: params.subjectUserId,
    metadata: {
      scope: params.scope,
      purpose: params.purpose,
      grantedToOrganisationId: params.grantedToOrganisationId,
      requestedFields: params.requestedFields ?? [],
      reason,
      exactPurposeGate: isAcsExactConsentEnabled(),
    },
  });
}
