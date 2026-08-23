/**
 * Alexa → MapAble authorization boundary.
 *
 * OAuth account linking proves an Alexa account is linked to a MapAble user.
 * It does NOT authorize Home actions. Every consequential action still passes
 * `evaluateHomeAuthority` / confirmation.
 */

import { mapableHomeFlags } from "@/lib/config/mapable-home";

import type { HomeActionRequest } from "../../contracts/action";
import type { AuthorityDecision } from "../../contracts/authority";
import {
  evaluateHomeAuthority,
  type AuthorityEvaluatorContext,
} from "../../core/authority-evaluator";
import { isSafetyCriticalKind } from "../../core/capability-registry";
import { AlexaIntentAdapter } from "./alexa-adapter";
import {
  validateAlexaAccessTokenClaims,
  type ValidateAlexaClaimsOptions,
} from "./claims";
import type { ValidatedAlexaIdentity } from "./types";

export type AlexaAuthorityGateInput = {
  claims: ValidateAlexaClaimsOptions["claims"];
  linkedMapAbleUserId: string | null;
  bodyUserId?: string | null;
  actionRequest: Omit<HomeActionRequest, "participantId" | "actorId"> & {
    participantId?: string;
    actorId?: string;
  };
  authorityContext: AuthorityEvaluatorContext;
  nowMs?: number;
};

export type AlexaAuthorityGateResult =
  | {
      ok: false;
      code:
        | "FEATURE_DISABLED"
        | "CLAIMS_INVALID"
        | "NOT_LINKED"
        | "BODY_USER_ID_REJECTED"
        | "SAFETY_CRITICAL_NOT_SUPPORTED"
        | "AUTHORITY_DENIED"
        | "AUTHORITY_REQUIRES_CONFIRMATION";
      reason: string;
      claimReason?: string;
      decision?: AuthorityDecision;
    }
  | {
      ok: true;
      identity: ValidatedAlexaIdentity;
      mapAbleUserId: string;
      decision: Extract<AuthorityDecision, { outcome: "ALLOW" }>;
      actionRequest: HomeActionRequest;
    };

export function evaluateAlexaHomeAuthorityGate(
  input: AlexaAuthorityGateInput,
): AlexaAuthorityGateResult {
  if (!mapableHomeFlags.enabled || !mapableHomeFlags.alexaEnabled) {
    return {
      ok: false,
      code: "FEATURE_DISABLED",
      reason: "Alexa Home integration flags are off.",
    };
  }

  if (input.bodyUserId != null && String(input.bodyUserId).trim() !== "") {
    return {
      ok: false,
      code: "BODY_USER_ID_REJECTED",
      reason:
        "Request body userId is not trusted. MapAble identity is resolved server-side from the account link.",
    };
  }

  const claimsResult = validateAlexaAccessTokenClaims({
    claims: input.claims,
    nowMs: input.nowMs,
  });
  if (!claimsResult.ok) {
    return {
      ok: false,
      code: "CLAIMS_INVALID",
      reason: "Access token claims failed validation.",
      claimReason: claimsResult.reason,
    };
  }

  if (!input.linkedMapAbleUserId) {
    return {
      ok: false,
      code: "NOT_LINKED",
      reason: "No active MapAble ExternalAccountLink for this Alexa subject.",
    };
  }

  if (isSafetyCriticalKind(input.actionRequest.capabilityKind)) {
    return {
      ok: false,
      code: "SAFETY_CRITICAL_NOT_SUPPORTED",
      reason: "Safety-critical Home actions remain NOT_SUPPORTED for Alexa.",
    };
  }

  const actionRequest: HomeActionRequest = {
    ...input.actionRequest,
    participantId: input.linkedMapAbleUserId,
    actorId: input.linkedMapAbleUserId,
    vendorPermissionClaimed: true,
  };

  const decision = evaluateHomeAuthority(actionRequest, input.authorityContext);

  if (decision.outcome === "DENY") {
    return {
      ok: false,
      code: "AUTHORITY_DENIED",
      reason: decision.basis,
      decision,
    };
  }

  if (decision.outcome === "REQUIRE_CONFIRMATION") {
    return {
      ok: false,
      code: "AUTHORITY_REQUIRES_CONFIRMATION",
      reason: decision.basis,
      decision,
    };
  }

  return {
    ok: true,
    identity: claimsResult.identity,
    mapAbleUserId: input.linkedMapAbleUserId,
    decision,
    actionRequest,
  };
}

export function accountLinkGrantsHomeAuthority(): false {
  return false;
}

export function assertAlexaCannotExecuteDevices(): {
  allowed: false;
  adapterStatus: "SCAFFOLDED";
} {
  const adapter = new AlexaIntentAdapter();
  return {
    allowed: false,
    adapterStatus: adapter.status,
  };
}
