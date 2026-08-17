import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { hasParticipantAuthority } from "@/lib/authority/participant-authority-service";
import { userCanAccessTenant } from "@/lib/platform/multi-tenant-admin/tenant-service";

import {
  NAVIGATOR_CONSENT_PURPOSE,
  verifyPurposeConsent,
} from "@/lib/ai/navigator/consent-gate";
import {
  assertNavigatorCapability,
  NAVIGATOR_AUDIT,
} from "@/lib/ai/navigator/gates";

export type NavigatorPilotAccessInput = {
  tenantId: string;
  participantId: string;
  actorUserId: string;
  /**
   * When true, allow a scoped delegate via hasParticipantAuthority.
   * Default false — actor must be the participant.
   */
  allowDelegation?: boolean;
  /** Required when allowDelegation is true and actor ≠ participant. */
  delegationAction?: string;
  delegationDomain?: string;
  consentScopes?: string[];
  /** Skip audit (unit tests). */
  silent?: boolean;
};

export type NavigatorPilotAccessResult =
  | { ok: true; viaDelegation: boolean }
  | {
      ok: false;
      reason: "tenant_forbidden" | "forbidden" | "delegation_invalid";
    };

/**
 * Shared pilot access gate: tenant membership + participant identity
 * (or explicit scoped delegation). Fail closed.
 */
export async function assertNavigatorPilotAccess(
  input: NavigatorPilotAccessInput,
): Promise<NavigatorPilotAccessResult> {
  const tenantId = input.tenantId.trim();
  const participantId = input.participantId.trim();
  const actorUserId = input.actorUserId.trim();

  if (!tenantId || !participantId || !actorUserId) {
    return { ok: false, reason: "forbidden" };
  }

  const membershipOk = await userCanAccessTenant(actorUserId, tenantId);
  if (!membershipOk) {
    if (!input.silent) {
      await createAuditEvent({
        actorUserId,
        participantId,
        action: NAVIGATOR_AUDIT.gateDenied,
        entityType: "NavigatorPilotAccess",
        entityId: tenantId,
        metadata: { reason: "tenant_forbidden", tenantId },
      });
    }
    return { ok: false, reason: "tenant_forbidden" };
  }

  if (actorUserId === participantId) {
    return { ok: true, viaDelegation: false };
  }

  if (!input.allowDelegation) {
    if (!input.silent) {
      await createAuditEvent({
        actorUserId,
        participantId,
        action: NAVIGATOR_AUDIT.gateDenied,
        entityType: "NavigatorPilotAccess",
        entityId: participantId,
        metadata: { reason: "forbidden", tenantId },
      });
    }
    return { ok: false, reason: "forbidden" };
  }

  const action = input.delegationAction?.trim();
  if (!action) {
    return { ok: false, reason: "delegation_invalid" };
  }

  const authorised = await hasParticipantAuthority({
    participantId,
    actorUserId,
    domain: input.delegationDomain ?? "navigator",
    action,
    consentScopes: input.consentScopes,
  });
  if (!authorised) {
    if (!input.silent) {
      await createAuditEvent({
        actorUserId,
        participantId,
        action: NAVIGATOR_AUDIT.gateDenied,
        entityType: "NavigatorPilotAccess",
        entityId: participantId,
        metadata: { reason: "delegation_invalid", tenantId, action },
      });
    }
    return { ok: false, reason: "delegation_invalid" };
  }

  return { ok: true, viaDelegation: true };
}

/** Map access denial to an API error code. */
export function navigatorAccessErrorCode(
  reason: "tenant_forbidden" | "forbidden" | "delegation_invalid",
): string {
  switch (reason) {
    case "tenant_forbidden":
      return "TENANT_FORBIDDEN";
    case "delegation_invalid":
      return "DELEGATION_INVALID";
    case "forbidden":
      return "FORBIDDEN";
    default: {
      const _exhaustive: never = reason;
      return String(_exhaustive);
    }
  }
}

export const NAVIGATOR_MATCH_CAPABILITY =
  "navigator.provider_search.match" as const;

/**
 * Capability + purpose-consent gate for passport/memory/escalate surfaces.
 * Tenant membership is asserted separately via assertNavigatorPilotAccess.
 */
export async function assertNavigatorConsentAndCapability(input: {
  tenantId: string;
  participantId: string;
  actorUserId: string;
  capabilityKey: string;
  action: string;
  permittedFields?: string[];
  silent?: boolean;
}): Promise<{ ok: true } | { ok: false; code: string }> {
  const gate = await assertNavigatorCapability({
    capabilityKey: input.capabilityKey,
    tenantId: input.tenantId,
    participantId: input.participantId,
    actorUserId: input.actorUserId,
    silent: input.silent,
  });
  if (!gate.allowed) {
    return { ok: false, code: `NAVIGATOR_GATE_DENIED:${gate.reason}` };
  }

  const consent = await verifyPurposeConsent({
    tenantId: input.tenantId,
    participantId: input.participantId,
    actorUserId: input.actorUserId,
    scope: "profile.read",
    purpose: NAVIGATOR_CONSENT_PURPOSE,
    action: input.action,
    permittedFields: input.permittedFields,
    delegationDomain: "navigator",
    silent: input.silent,
  });
  if (!consent.ok) {
    return {
      ok: false,
      code: `NAVIGATOR_CONSENT_${consent.reason.toUpperCase()}`,
    };
  }

  return { ok: true };
}
