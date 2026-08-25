import { randomUUID } from "crypto";

import type { AuthorityDecision, DelegatedAuthority } from "../contracts/authority";
import type { HomeActionRequest } from "../contracts/action";
import type { HomeAutonomyLevel } from "../contracts/capability";
import type { HomePrivacyZone } from "../contracts/privacy";
import { getHomeCapability, isSafetyCriticalKind } from "./capability-registry";

export const CONFIRMATION_TTL_MS = 5 * 60 * 1000;

export type PendingConfirmation = {
  token: string;
  requestId: string;
  participantId: string;
  expiresAt: string;
  refused?: boolean;
};

export type AuthorityEvaluatorContext = {
  now?: Date;
  participantAutonomyCeiling: HomeAutonomyLevel;
  preAuthorisedCapabilityKinds?: string[];
  delegations?: DelegatedAuthority[];
  privacyZone?: HomePrivacyZone;
  allowedPrivacyZones?: HomePrivacyZone[];
  participantRefused?: boolean;
  pendingConfirmations?: Map<string, PendingConfirmation>;
};

const RANK: Record<HomeAutonomyLevel, number> = {
  H0_OBSERVE: 0,
  H1_SUGGEST: 1,
  H2_PREPARE: 2,
  H3_CONFIRM: 3,
  H4_BOUNDED_AUTO: 4,
  H5_ROUTINE_ORCHESTRATION: 5,
};

function issueConfirmation(
  request: HomeActionRequest,
  basis: string,
  level: HomeAutonomyLevel,
  now: Date,
  store?: Map<string, PendingConfirmation>,
): AuthorityDecision {
  const token = randomUUID();
  const expiresAt = new Date(now.getTime() + CONFIRMATION_TTL_MS).toISOString();
  store?.set(token, {
    token,
    requestId: request.id,
    participantId: request.participantId,
    expiresAt,
  });
  return {
    outcome: "REQUIRE_CONFIRMATION",
    basis,
    autonomyLevel: level,
    confirmationToken: token,
    expiresAt,
  };
}

/** Deterministic MapAble authority. Vendor permission alone is never enough. */
export function evaluateHomeAuthority(
  request: HomeActionRequest,
  ctx: AuthorityEvaluatorContext,
): AuthorityDecision {
  const now = ctx.now ?? new Date();

  if (ctx.participantRefused) {
    return { outcome: "DENY", basis: "Participant refused this action.", code: "PARTICIPANT_REFUSAL" };
  }

  if (isSafetyCriticalKind(request.capabilityKind)) {
    return {
      outcome: "DENY",
      basis: "Safety-critical capabilities are not supported in MapAble Home P0.",
      code: "SAFETY_CRITICAL_NOT_SUPPORTED",
    };
  }

  const capability = getHomeCapability(request.capabilityKind);
  if (!capability || !capability.executableInP0) {
    return {
      outcome: "DENY",
      basis: `Capability ${request.capabilityKind} is not supported in P0.`,
      code: "NOT_SUPPORTED",
    };
  }

  if (
    ctx.privacyZone &&
    ctx.allowedPrivacyZones &&
    !ctx.allowedPrivacyZones.includes(ctx.privacyZone)
  ) {
    return {
      outcome: "DENY",
      basis: `Privacy zone ${ctx.privacyZone} is outside the actor's authorised purpose.`,
      code: "PRIVACY_ZONE_BLOCKED",
    };
  }

  if (
    request.vendorPermissionClaimed === true &&
    request.actorId !== request.participantId &&
    !request.delegationId &&
    !request.confirmationToken
  ) {
    return {
      outcome: "DENY",
      basis:
        "Vendor permission alone is not MapAble authority. Participant confirmation or delegation is required.",
      code: "VENDOR_PERMISSION_INSUFFICIENT",
    };
  }

  if (request.delegationId) {
    const delegation = ctx.delegations?.find((d) => d.id === request.delegationId);
    if (!delegation || !delegation.active) {
      return { outcome: "DENY", basis: "Delegation is missing or inactive.", code: "DELEGATION_EXPIRED" };
    }
    const from = new Date(delegation.validFrom).getTime();
    const until = new Date(delegation.validUntil).getTime();
    const t = now.getTime();
    if (t < from || t > until) {
      return {
        outcome: "DENY",
        basis: "Delegation window has expired or not yet started.",
        code: "DELEGATION_EXPIRED",
      };
    }
    if (delegation.deniedCapabilityKinds.includes(request.capabilityKind)) {
      return {
        outcome: "DENY",
        basis: "Delegation explicitly denies this capability.",
        code: "DELEGATION_DENIED",
      };
    }
    if (!delegation.allowedCapabilityKinds.includes(request.capabilityKind)) {
      return {
        outcome: "DENY",
        basis: "Capability is outside the purpose-bound delegation.",
        code: "DELEGATION_DENIED",
      };
    }
    if (!capability.delegatable) {
      return {
        outcome: "DENY",
        basis: "This capability cannot be delegated.",
        code: "DELEGATION_DENIED",
      };
    }
  }

  if (request.confirmationToken) {
    const pending = ctx.pendingConfirmations?.get(request.confirmationToken);
    if (!pending || pending.requestId !== request.id) {
      return {
        outcome: "DENY",
        basis: "Confirmation token is invalid for this request.",
        code: "CONFIRMATION_EXPIRED",
      };
    }
    if (pending.refused) {
      return {
        outcome: "DENY",
        basis: "Participant refused the confirmation.",
        code: "PARTICIPANT_REFUSAL",
      };
    }
    if (new Date(pending.expiresAt).getTime() < now.getTime()) {
      return {
        outcome: "DENY",
        basis: "Confirmation token has expired.",
        code: "CONFIRMATION_EXPIRED",
      };
    }
    return {
      outcome: "ALLOW",
      basis: "Participant confirmed the action within the confirmation window.",
      autonomyLevel: "H3_CONFIRM",
    };
  }

  const required = capability.minimumAuthorityLevel;
  const ceiling = ctx.participantAutonomyCeiling;
  if (RANK[ceiling] < RANK[required]) {
    return {
      outcome: "DENY",
      basis: `Participant autonomy ceiling ${ceiling} is below required ${required}.`,
      code: "INSUFFICIENT_AUTHORITY",
    };
  }

  if (
    ceiling === "H4_BOUNDED_AUTO" &&
    capability.riskClass === "LOW" &&
    (ctx.preAuthorisedCapabilityKinds?.includes(request.capabilityKind) ?? false)
  ) {
    return {
      outcome: "ALLOW",
      basis: "Pre-authorised low-risk capability within H4 bounded auto rules.",
      autonomyLevel: "H4_BOUNDED_AUTO",
    };
  }

  if (capability.requiresConfirmation || capability.riskClass !== "LOW") {
    return issueConfirmation(
      request,
      "Participant confirmation is required before this action can proceed.",
      "H3_CONFIRM",
      now,
      ctx.pendingConfirmations,
    );
  }

  if (request.capabilityKind === "READ_STATE" || RANK[required] <= 1) {
    return {
      outcome: "ALLOW",
      basis: "Observe / low-impact capability within participant authority.",
      autonomyLevel: ceiling,
    };
  }

  return issueConfirmation(
    request,
    "Default policy requires confirmation.",
    "H3_CONFIRM",
    now,
    ctx.pendingConfirmations,
  );
}

export function refuseConfirmation(
  store: Map<string, PendingConfirmation>,
  token: string,
): void {
  const pending = store.get(token);
  if (pending) store.set(token, { ...pending, refused: true });
}
