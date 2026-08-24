import { minAuthority } from "@/lib/ai/platform/agents/authority";
import { getAiCapability } from "@/lib/ai/platform/capabilities/registry";
import type { AuthorityCeiling } from "@/lib/ai/platform/types/authority";
import {
  actionKernelConfig,
  isActionTypeEnabled,
  type ActionKernelFlagKey,
} from "@/lib/config/action-kernel";
import { aiPlatformConfig } from "@/lib/config/ai-platform";

import { getMapAbleActionDefinition } from "./registry";
import { validateActionPayload } from "./schemas";
import type {
  ActionPolicyDecision,
  MapAbleActionKey,
  MapAbleActionProposal,
} from "./types";

export function computeEffectiveActionAuthority(input: {
  missionAuthority: AuthorityCeiling;
  agentAuthority?: AuthorityCeiling;
  capabilityKey?: string;
  actionKey: MapAbleActionKey;
  actorAuthority: AuthorityCeiling;
}): AuthorityCeiling {
  const actionDef = getMapAbleActionDefinition(input.actionKey);
  const parts: AuthorityCeiling[] = [
    input.missionAuthority,
    input.actorAuthority,
    actionDef.authorityCeiling,
  ];
  if (input.agentAuthority) parts.push(input.agentAuthority);
  if (input.capabilityKey) {
    const cap = getAiCapability(input.capabilityKey);
    if (cap) parts.push(cap.authorityCeiling);
  }
  return minAuthority(...parts);
}

export function evaluateActionPolicy(input: {
  actionKey: MapAbleActionKey;
  payload: Record<string, unknown>;
  consentScopes: string[];
  missionAuthority?: AuthorityCeiling;
  agentAuthority?: AuthorityCeiling;
  capabilityKey?: string;
  actorAuthority?: AuthorityCeiling;
  proposal?: MapAbleActionProposal;
}): ActionPolicyDecision {
  const missionAuthority = input.missionAuthority ?? "SUGGEST_WITH_PARTICIPANT_APPROVAL";
  const actorAuthority = input.actorAuthority ?? "SUGGEST_WITH_PARTICIPANT_APPROVAL";
  const effectiveAuthority = computeEffectiveActionAuthority({
    missionAuthority,
    agentAuthority: input.agentAuthority,
    capabilityKey: input.capabilityKey,
    actionKey: input.actionKey,
    actorAuthority,
  });

  const deny = (
    reasonCode: ActionPolicyDecision["reasonCode"],
    detail?: string,
  ): ActionPolicyDecision => ({
    allowed: false,
    reasonCode,
    detail,
    effectiveAuthority,
  });

  if (aiPlatformConfig.globalKillSwitch || actionKernelConfig.killSwitchEngaged) {
    return deny("action_kernel_kill_switch");
  }
  if (!actionKernelConfig.enabled) {
    return deny("action_kernel_disabled");
  }
  if (!isActionTypeEnabled(input.actionKey as ActionKernelFlagKey)) {
    return deny("action_type_disabled", `Action ${input.actionKey} is disabled`);
  }

  // Participant-approved actions may reach DETERMINISTIC_EXECUTE_VIA_SERVICE
  // only through the approval + adapter path. Proposal/policy gate requires at
  // least SUGGEST_WITH_PARTICIPANT_APPROVAL (AI must not auto-execute).
  const minimumForGovernedAction: AuthorityCeiling =
    "SUGGEST_WITH_PARTICIPANT_APPROVAL";
  if (compareExecuteAuthority(effectiveAuthority, minimumForGovernedAction) < 0) {
    return deny("authority_insufficient");
  }

  const definition = getMapAbleActionDefinition(input.actionKey);

  for (const scope of definition.requiredConsentScopes) {
    if (!input.consentScopes.includes(scope)) {
      return deny("missing_consent", `Missing consent scope: ${scope}`);
    }
  }

  try {
    validateActionPayload(input.actionKey, input.payload);
  } catch {
    return deny("invalid_payload");
  }

  if (input.proposal) {
    if (input.proposal.status === "expired") {
      return deny("proposal_expired");
    }
    if (
      !["proposed", "awaiting_approval", "approved"].includes(
        input.proposal.status,
      )
    ) {
      return deny("proposal_not_approvable");
    }
  }

  return { allowed: true, effectiveAuthority };
}

/** Returns negative if effective is stricter than required. */
function compareExecuteAuthority(
  effective: AuthorityCeiling,
  required: AuthorityCeiling,
): number {
  const rank: Record<AuthorityCeiling, number> = {
    NO_OPERATIONAL_AUTHORITY: 0,
    READ_ONLY_EXPLAIN: 1,
    DRAFT_ONLY: 2,
    SUGGEST_WITH_HUMAN_REVIEW: 3,
    SUGGEST_WITH_PARTICIPANT_APPROVAL: 4,
    DETERMINISTIC_EXECUTE_VIA_SERVICE: 5,
  };
  return rank[effective] - rank[required];
}

export function evaluateExecutionPolicy(input: {
  proposal: MapAbleActionProposal;
  bindingPayloadHash: string;
  missionAuthority?: AuthorityCeiling;
}): ActionPolicyDecision {
  const base = evaluateActionPolicy({
    actionKey: input.proposal.actionKey,
    payload: input.proposal.payload,
    consentScopes: input.proposal.consentScopes,
    missionAuthority: input.missionAuthority,
    proposal: input.proposal,
  });
  if (!base.allowed) return base;

  if (input.proposal.status !== "approved") {
    return {
      ...base,
      allowed: false,
      reasonCode: "proposal_not_approvable",
      detail: "Proposal must be approved before execution",
    };
  }

  if (input.bindingPayloadHash !== input.proposal.payloadHash) {
    return {
      ...base,
      allowed: false,
      reasonCode: "payload_hash_mismatch",
    };
  }

  if (Date.parse(input.proposal.expiresAt) <= Date.now()) {
    return {
      ...base,
      allowed: false,
      reasonCode: "proposal_expired",
    };
  }

  return base;
}
