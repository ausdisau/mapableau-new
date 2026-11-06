import { createAuditEvent } from "@/lib/audit/audit-event-service";
import type { CurrentUser } from "@/lib/auth/current-user";
import { grantConsent, revokeConsent } from "@/lib/consent/consent-service";

/**
 * Thin MapAble Core bridge — never invents a second consent or audit ledger.
 * When Core/DB is unavailable (memory pilot), records synthetic local receipts.
 */

export interface SyntheticConsentReceipt {
  id: string;
  subjectUserId: string;
  purpose: string;
  status: "active" | "revoked";
  createdAt: string;
  revokedAt: string | null;
}

const syntheticConsents = new Map<string, SyntheticConsentReceipt>();

export async function recordCoverageCareAudit(input: {
  actorUserId: string;
  action: string;
  entityType: string;
  entityId?: string;
  participantId?: string;
  organisationId?: string;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  try {
    await createAuditEvent({
      actorUserId: input.actorUserId,
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId ?? null,
      participantId: input.participantId ?? null,
      organisationId: input.organisationId ?? null,
      metadata: input.metadata ?? null,
    });
  } catch {
    // Audit must not block the synthetic pilot path when DB is absent.
  }
}

export async function grantEnquiryShareConsent(input: {
  participant: CurrentUser;
  organisationId?: string | null;
  purpose: string;
  useSynthetic: boolean;
}): Promise<{ consentRecordId: string }> {
  if (input.useSynthetic) {
    const id = `cc-consent-${crypto.randomUUID()}`;
    syntheticConsents.set(id, {
      id,
      subjectUserId: input.participant.id,
      purpose: input.purpose,
      status: "active",
      createdAt: new Date().toISOString(),
      revokedAt: null,
    });
    await recordCoverageCareAudit({
      actorUserId: input.participant.id,
      action: "coverage_care.consent.granted_synthetic",
      entityType: "CoverageCareConsent",
      entityId: id,
      participantId: input.participant.id,
      metadata: { purpose: input.purpose, synthetic: true },
    });
    return { consentRecordId: id };
  }

  const record = await grantConsent({
    subjectUserId: input.participant.id,
    grantedToOrganisationId: input.organisationId ?? undefined,
    scope: "care.accessibility_share",
    purpose: input.purpose,
    createdById: input.participant.id,
    sourceAction: "coverage_care.enquiry.share",
  });
  return { consentRecordId: record.id };
}

export async function revokeEnquiryShareConsent(input: {
  consentRecordId: string;
  revokedById: string;
  useSynthetic: boolean;
}): Promise<void> {
  if (input.useSynthetic) {
    const existing = syntheticConsents.get(input.consentRecordId);
    if (existing) {
      syntheticConsents.set(input.consentRecordId, {
        ...existing,
        status: "revoked",
        revokedAt: new Date().toISOString(),
      });
    }
    await recordCoverageCareAudit({
      actorUserId: input.revokedById,
      action: "coverage_care.consent.revoked_synthetic",
      entityType: "CoverageCareConsent",
      entityId: input.consentRecordId,
      metadata: { synthetic: true },
    });
    return;
  }

  await revokeConsent(input.consentRecordId, input.revokedById);
}

export function getSyntheticConsent(
  id: string,
): SyntheticConsentReceipt | undefined {
  return syntheticConsents.get(id);
}

export function resetSyntheticConsentsForTests() {
  syntheticConsents.clear();
}
