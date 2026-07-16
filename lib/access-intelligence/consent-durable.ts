/**
 * Durable Access Intelligence consent composed onto canonical ConsentRecord.
 * In-memory grants remain for demo/unit tests; production paths persist.
 */

import type { ConsentScope } from "@/types/mapable";

import { grantConsent, revokeConsent } from "@/lib/consent/consent-service";
import { prisma } from "@/lib/prisma";

import type { ConsentGrant, SensitiveAction } from "./rights/action-policy";
import {
  storeConsentGrant,
  revokeConsentGrant,
} from "./rights/action-policy";

const PURPOSE_TO_SCOPE: Record<ConsentGrant["purpose"], ConsentScope> = {
  venue_verification: "access.venue_verification",
  visit_plan_sharing: "access.visit_plan_share",
  support_worker_sharing: "access.passport_share",
  research: "access.passport_share",
};

const ACTION_TO_SCOPE: Record<SensitiveAction, ConsentScope> = {
  requestVenueVerification: "access.venue_verification",
  submitBarrierReport: "access.venue_verification",
  shareAccessPassport: "access.passport_share",
  shareVisitPlan: "access.visit_plan_share",
};

export function consentScopeForPurpose(
  purpose: ConsentGrant["purpose"],
): ConsentScope {
  return PURPOSE_TO_SCOPE[purpose];
}

export function consentScopeForAction(action: SensitiveAction): ConsentScope {
  return ACTION_TO_SCOPE[action];
}

export async function grantDurableAccessConsent(input: {
  grant: ConsentGrant;
  createdById: string;
  grantedToOrganisationId?: string;
  grantedToUserId?: string;
}): Promise<{ grant: ConsentGrant; consentRecordId: string }> {
  const scope = consentScopeForPurpose(input.grant.purpose);
  const record = await grantConsent({
    subjectUserId: input.grant.userId,
    grantedToUserId: input.grantedToUserId,
    grantedToOrganisationId: input.grantedToOrganisationId,
    scope,
    purpose: input.grant.purpose,
    expiryDate: input.grant.expiresAt
      ? new Date(input.grant.expiresAt)
      : undefined,
    createdById: input.createdById,
    recipientType: "organisation",
    dataScope: input.grant.fieldKeys,
    sourceAction: `access_intelligence.${input.grant.purpose}`,
  });

  const grant: ConsentGrant = {
    ...input.grant,
    id: record.id,
  };
  storeConsentGrant(grant);
  return { grant, consentRecordId: record.id };
}

export async function revokeDurableAccessConsent(input: {
  grantId: string;
  revokedById: string;
}): Promise<{ grant: ConsentGrant | null; consentRecordId: string | null }> {
  const memory = revokeConsentGrant(input.grantId);
  const existing = await prisma.consentRecord.findUnique({
    where: { id: input.grantId },
  });
  if (!existing) {
    return { grant: memory, consentRecordId: null };
  }
  await revokeConsent(input.grantId, input.revokedById);
  return { grant: memory, consentRecordId: input.grantId };
}
