/**
 * Default production adapters for P01 PEP.
 * Thin wrappers over MapAble Core SoTs — no second consent/authority ledger.
 */

import {
  verifyPurposeConsent,
  type PurposeConsentVerificationResult,
} from "@/lib/ai/navigator/consent-gate";
import { getUserOrganisationIds } from "@/lib/api/organisation-scope";
import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { hasParticipantAuthority } from "@/lib/authority/participant-authority-service";
import { isUnifiedProhibitedUse } from "@/lib/careos/policy/unified-prohibited-uses";
import { isProgrammeAuraStopped } from "@/lib/programmes/aura/execution-gate";
import type { ConsentScope } from "@/types/mapable";

import { isPepEnabled } from "./flag";
import type { PepAdapters, PepConsentResult } from "./types";

function mapConsentResult(
  result: PurposeConsentVerificationResult,
): PepConsentResult {
  if (result.ok) {
    return {
      ok: true,
      consentRecordId: result.consentRecordId,
      viaDelegation: result.viaDelegation,
    };
  }
  return { ok: false, reason: result.reason };
}

export const defaultPepAdapters: PepAdapters = {
  isPepEnabled,
  isAuraStopped: () => isProgrammeAuraStopped(),
  isProhibitedUse: (capability: string) => isUnifiedProhibitedUse(capability),
  getActorOrganisationIds: (actorUserId: string) =>
    getUserOrganisationIds(actorUserId),
  verifyPurposeConsent: async (input) => {
    const result = await verifyPurposeConsent({
      tenantId: input.tenantId,
      participantId: input.participantId,
      actorUserId: input.actorUserId,
      scope: input.scope as ConsentScope,
      purpose: input.purpose,
      permittedFields: input.permittedFields,
      action: input.action,
      delegationDomain: input.delegationDomain,
      now: input.now,
      silent: input.silent ?? true,
    });
    return mapConsentResult(result);
  },
  hasParticipantAuthority: async (input) =>
    hasParticipantAuthority({
      participantId: input.participantId,
      actorUserId: input.actorUserId,
      tenantId: input.tenantId,
      domain: input.domain,
      action: input.action,
      consentScopes: input.consentScopes,
      now: input.now,
    }),
  auditDecision: async (input) => {
    await createAuditEvent({
      actorUserId: input.actorUserId,
      participantId: input.participantId,
      organisationId: input.organisationId,
      action: input.decision.allowed
        ? "pep.access.allow"
        : "pep.access.deny",
      entityType: "pep_access",
      entityId: input.resource,
      metadata: {
        purpose: input.purpose,
        action: input.action,
        allowed: input.decision.allowed,
        reason: input.decision.allowed ? null : input.decision.reason,
        policyVersion: input.decision.policyVersion,
        correlationId: input.decision.correlationId,
      },
    });
  },
};

/** Build a stub adapter set for synthetic unit tests. */
export function createSyntheticPepAdapters(
  overrides: Partial<PepAdapters> = {},
): PepAdapters {
  return {
    isPepEnabled: () => true,
    isAuraStopped: () => false,
    isProhibitedUse: () => false,
    getActorOrganisationIds: async () => [],
    verifyPurposeConsent: async () => ({
      ok: false,
      reason: "consent_missing",
    }),
    hasParticipantAuthority: async () => false,
    auditDecision: async () => undefined,
    ...overrides,
  };
}
