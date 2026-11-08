/**
 * Stage 1 policy enforcement point for synthetic ACS paths.
 *
 * Server-derived actor + tenant + participant + Stop + exact consent.
 * Client-supplied role is never an authority source. No ParticipantRAG.
 */
import {
  ACS_EXACT_CONSENT_SKIPPED_LOG,
  isAcsDurableStopEnabled,
  isAcsExactConsentEnabled,
} from "@/lib/config/autonomy-care";
import { checkExactPurposeConsent } from "@/lib/consent/exact-purpose-check";
import {
  assertCrossTenantDenied,
  isDurableProgrammeAuraStopped,
  isProgrammeAuraStopped,
} from "@/lib/programmes/aura/execution-gate";
import { ProgrammeInvariantError } from "@/lib/programmes/safety-invariants";
import type { ConsentScope } from "@/types/mapable";

export type AutonomyPepInput = {
  actorUserId: string;
  tenantId: string;
  participantId: string;
  purpose: string;
  scope: ConsentScope;
  requestedFields?: string[];
  grantedToUserId?: string;
  grantedToOrganisationId?: string;
  resourceOrganisationId?: string | null;
  /** If present, evaluation fails closed. Role must be server-derived. */
  clientSuppliedRole?: unknown;
};

export type AutonomyPepResult = {
  allowed: boolean;
  reason: string;
  consentRecordId?: string;
};

export async function evaluateAutonomyPep(
  input: AutonomyPepInput,
): Promise<AutonomyPepResult> {
  if (input.clientSuppliedRole !== undefined) {
    return {
      allowed: false,
      reason: "Client-supplied role is not an authority source",
    };
  }

  if (!input.actorUserId.trim()) {
    return { allowed: false, reason: "Server-derived actor is required" };
  }

  try {
    assertCrossTenantDenied({
      actorOrganisationId: input.tenantId,
      resourceOrganisationId: input.resourceOrganisationId ?? input.tenantId,
    });
  } catch (error) {
    if (error instanceof ProgrammeInvariantError) {
      return { allowed: false, reason: error.message };
    }
    throw error;
  }

  if (isProgrammeAuraStopped()) {
    return {
      allowed: false,
      reason: "Programme execution blocked: AURA/programme stop is active",
    };
  }

  if (isAcsDurableStopEnabled()) {
    const durable = await isDurableProgrammeAuraStopped({
      tenantId: input.tenantId,
      participantId: input.participantId,
    });
    if (durable) {
      return {
        allowed: false,
        reason: "Programme execution blocked: durable stop is active",
      };
    }
  }

  if (!isAcsExactConsentEnabled()) {
    console.info(ACS_EXACT_CONSENT_SKIPPED_LOG);
    return {
      allowed: false,
      reason: "ACS exact-purpose flag is off; retrieval is fail-closed",
    };
  }

  if (
    input.grantedToOrganisationId &&
    input.grantedToOrganisationId !== input.tenantId
  ) {
    return {
      allowed: false,
      reason: "Cross-organisation programme access denied",
    };
  }

  const consent = await checkExactPurposeConsent({
    subjectUserId: input.participantId,
    scope: input.scope,
    purpose: input.purpose,
    grantedToUserId: input.grantedToUserId,
    grantedToOrganisationId: input.tenantId,
    requestedFields: input.requestedFields,
  });

  if (!consent.allowed) {
    return {
      allowed: false,
      reason: consent.reason,
      consentRecordId: consent.consentRecordId,
    };
  }

  return {
    allowed: true,
    reason: "PEP allowed",
    consentRecordId: consent.consentRecordId,
  };
}

/**
 * Synthetic retrieval boundary. Throws before the loader runs when PEP denied.
 * Not ParticipantRAG and must not perform a live fetch.
 */
export function retrieveAuthorisedContext<T>(
  pep: AutonomyPepResult,
  load: () => T,
): T {
  if (!pep.allowed) {
    throw new Error(`PEP_DENIED_BEFORE_RETRIEVAL: ${pep.reason}`);
  }
  return load();
}
