/**
 * Deterministic Policy Enforcement Point — default deny.
 * Does not grant, revoke, or mutate permissions.
 */

import { defaultPepAdapters } from "./adapters";
import {
  PEP_POLICY_VERSION,
  type PepAccessRequest,
  type PepAdapters,
  type PepDecision,
  type PepDenialReason,
} from "./types";

function deny(
  reason: PepDenialReason,
  correlationId: string | null,
  evaluatedAt: string,
): PepDecision {
  return {
    allowed: false,
    reason,
    policyVersion: PEP_POLICY_VERSION,
    correlationId,
    evaluatedAt,
  };
}

function allow(input: {
  viaDelegation: boolean;
  consentRecordId: string | null;
  correlationId: string | null;
  evaluatedAt: string;
}): PepDecision {
  return {
    allowed: true,
    policyVersion: PEP_POLICY_VERSION,
    viaDelegation: input.viaDelegation,
    consentRecordId: input.consentRecordId,
    correlationId: input.correlationId,
    evaluatedAt: input.evaluatedAt,
  };
}

/**
 * Evaluate access for a protected retrieval / tool call.
 * Untrusted client claims on the request are intentionally ignored.
 */
export async function evaluateAccessPolicy(
  request: PepAccessRequest,
  adapters: PepAdapters = defaultPepAdapters,
): Promise<PepDecision> {
  const evaluatedAt = (request.now ?? new Date()).toISOString();
  const correlationId = request.correlationId?.trim() || null;

  // Client-supplied role/tenant/consent never influence the decision.
  void request.untrustedClientClaims;

  if (!adapters.isPepEnabled()) {
    return deny("pep_disabled", correlationId, evaluatedAt);
  }

  if (adapters.isAuraStopped()) {
    const decision = deny("stop_aura", correlationId, evaluatedAt);
    await safeAudit(adapters, request, decision);
    return decision;
  }

  if (request.capability && adapters.isProhibitedUse(request.capability)) {
    const decision = deny("prohibited_use", correlationId, evaluatedAt);
    await safeAudit(adapters, request, decision);
    return decision;
  }

  if (!request.actorUserId?.trim()) {
    return deny("missing_actor", correlationId, evaluatedAt);
  }
  if (!request.participantId?.trim()) {
    return deny("missing_participant", correlationId, evaluatedAt);
  }
  if (request.tenantId == null) {
    return deny("missing_tenant", correlationId, evaluatedAt);
  }
  const tenantId = request.tenantId.trim();
  if (tenantId.length === 0) {
    return deny("empty_tenant", correlationId, evaluatedAt);
  }

  const viaDelegation = request.actorUserId !== request.participantId;

  if (viaDelegation) {
    let orgIds: string[];
    try {
      orgIds = await adapters.getActorOrganisationIds(request.actorUserId);
    } catch {
      const decision = deny("adapter_error", correlationId, evaluatedAt);
      await safeAudit(adapters, request, decision);
      return decision;
    }
    if (!orgIds.includes(tenantId)) {
      const decision = deny(
        "tenant_membership_denied",
        correlationId,
        evaluatedAt,
      );
      await safeAudit(adapters, request, decision);
      return decision;
    }

    const domain = request.delegationDomain ?? "virtual_persona";
    let authorised: boolean;
    try {
      authorised = await adapters.hasParticipantAuthority({
        participantId: request.participantId,
        actorUserId: request.actorUserId,
        tenantId,
        domain,
        action: request.action,
        consentScopes: [request.consentScope],
        now: request.now,
      });
    } catch {
      const decision = deny("adapter_error", correlationId, evaluatedAt);
      await safeAudit(adapters, request, decision);
      return decision;
    }
    if (!authorised) {
      const decision = deny("delegation_invalid", correlationId, evaluatedAt);
      await safeAudit(adapters, request, decision);
      return decision;
    }
  }

  let consent;
  try {
    consent = await adapters.verifyPurposeConsent({
      tenantId,
      participantId: request.participantId,
      actorUserId: request.actorUserId,
      scope: request.consentScope,
      purpose: request.purpose,
      permittedFields: request.permittedFields,
      action: request.action,
      delegationDomain: request.delegationDomain,
      now: request.now,
      silent: true,
    });
  } catch {
    const decision = deny("adapter_error", correlationId, evaluatedAt);
    await safeAudit(adapters, request, decision);
    return decision;
  }

  if (!consent.ok) {
    const decision = deny(consent.reason, correlationId, evaluatedAt);
    await safeAudit(adapters, request, decision);
    return decision;
  }

  const decision = allow({
    viaDelegation: viaDelegation || consent.viaDelegation,
    consentRecordId: consent.consentRecordId,
    correlationId,
    evaluatedAt,
  });
  if (!request.silent) {
    await safeAudit(adapters, request, decision);
  }
  return decision;
}

async function safeAudit(
  adapters: PepAdapters,
  request: PepAccessRequest,
  decision: PepDecision,
): Promise<void> {
  if (request.silent) return;
  try {
    await adapters.auditDecision({
      actorUserId: request.actorUserId || "unknown",
      participantId: request.participantId || "unknown",
      organisationId: (request.tenantId || "").trim() || "unknown",
      decision,
      resource: request.resource,
      action: request.action,
      purpose: request.purpose,
    });
  } catch {
    // Audit failure must not flip an allow into a side-effecting grant;
    // deny decisions already returned. Swallow to keep PEP fail-closed
    // without throwing after a decision.
  }
}
