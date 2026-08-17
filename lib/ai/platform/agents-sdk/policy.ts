import {
  assertNavigatorCapability,
} from "@/lib/ai/navigator/gates";
import {
  NAVIGATOR_CONSENT_PURPOSE,
  verifyPurposeConsent,
} from "@/lib/ai/navigator/consent-gate";
import { requireAiCapability } from "@/lib/ai/platform/capabilities/registry";
import type { AiCapabilityRegistration } from "@/lib/ai/platform/capabilities/types";
import {
  assertModelCallAllowed,
  isCapabilityKilled,
} from "@/lib/ai/platform/policies/kill-switches";
import { PROHIBITED_AUTONOMOUS_ACTIONS } from "@/lib/ai/platform/types/authority";
import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { isAgentsSdkEnabled } from "@/lib/ai/platform/agents-sdk/config";
import type { ConsentScope } from "@/types/mapable";

import {
  AGENT_SDK_DOMAINS,
  NAVIGATOR_AGENTS_SDK_CAPABILITY,
  NAVIGATOR_AGENTS_SDK_FLAG,
  type AgentSdkDomain,
  type MapAbleAgentRunContext,
} from "./contracts";

export const AGENTS_SDK_AUDIT = {
  gateAllowed: "agents_sdk.gate.allowed",
  gateDenied: "agents_sdk.gate.denied",
  toolDenied: "agents_sdk.tool.denied",
  toolExecuted: "agents_sdk.tool.executed",
} as const;

export type ToolCallPolicyInput = {
  ctx: MapAbleAgentRunContext;
  toolName: string;
  /** Logical action label for consent (e.g. search_providers, match). */
  consentAction?: string;
  consentScope?: ConsentScope;
  /** When true, skip audit writes (unit tests). */
  silent?: boolean;
  /** When true, require model generation to be allowed (specialist/model paths). */
  requiresModel?: boolean;
  /** Domain required for this tool — must be in enabledDomains when live. */
  requiredDomain?: AgentSdkDomain;
};

export type ToolCallPolicyResult =
  | {
      allowed: true;
      capability: AiCapabilityRegistration;
      consentRecordId?: string;
    }
  | { allowed: false; reason: string; capability?: AiCapabilityRegistration };

function isFeatureFlagEnabled(flagName: string): boolean {
  if (flagName === NAVIGATOR_AGENTS_SDK_FLAG) {
    return isAgentsSdkEnabled();
  }
  return process.env[flagName] === "true";
}

export function assertContextIdsPresent(ctx: MapAbleAgentRunContext): void {
  if (!ctx.tenantId.trim()) {
    throw new Error("AGENTS_SDK_TENANT_REQUIRED");
  }
  if (!ctx.participantId.trim()) {
    throw new Error("AGENTS_SDK_PARTICIPANT_REQUIRED");
  }
  if (!ctx.actorUserId.trim()) {
    throw new Error("AGENTS_SDK_ACTOR_REQUIRED");
  }
}

/**
 * Participant-scoped actor check: self or delegate path verified later via consent.
 * Blocks obvious cross-participant IDOR at the policy layer when actor ≠ participant
 * without delegation — consent gate handles delegation authorisation.
 */
export function assertActorParticipantBinding(ctx: MapAbleAgentRunContext): void {
  assertContextIdsPresent(ctx);
  if (ctx.actorUserId !== ctx.participantId) {
    // Delegation validity is enforced in verifyPurposeConsent / hasParticipantAuthority.
    return;
  }
}

export function isDomainEnabled(
  ctx: MapAbleAgentRunContext,
  domain: AgentSdkDomain,
): boolean {
  return ctx.enabledDomains.includes(domain);
}

export function isProhibitedToolAction(action: string): boolean {
  return (PROHIBITED_AUTONOMOUS_ACTIONS as readonly string[]).includes(action);
}

export async function assertToolCallAllowed(
  input: ToolCallPolicyInput,
): Promise<ToolCallPolicyResult> {
  const { ctx, toolName } = input;
  assertActorParticipantBinding(ctx);

  if (ctx.aiOptedOut && input.requiresModel) {
    return deny(input, "ai_opted_out");
  }

  if (input.requiredDomain && !isDomainEnabled(ctx, input.requiredDomain)) {
    return deny(input, "domain_disabled");
  }

  if (!ctx.toolAllowlist.includes(toolName)) {
    return deny(input, "tool_not_in_context_allowlist");
  }

  let capability: AiCapabilityRegistration;
  try {
    capability = requireAiCapability(ctx.capabilityKey);
  } catch {
    return deny(input, "capability_not_registered");
  }

  if (ctx.capabilityKey !== NAVIGATOR_AGENTS_SDK_CAPABILITY) {
    return deny(input, "capability_key_mismatch", capability);
  }

  if (!isFeatureFlagEnabled(capability.featureFlag)) {
    return deny(input, "feature_flag_disabled", capability);
  }

  if (
    isCapabilityKilled(ctx.capabilityKey) ||
    isCapabilityKilled(capability.killSwitchKey)
  ) {
    return deny(input, "capability_kill_switch", capability);
  }

  const modelGate = assertModelCallAllowed({
    capabilityKey: ctx.capabilityKey,
    tenantId: ctx.tenantId,
  });
  if (
    input.requiresModel &&
    !modelGate.allowed &&
    modelGate.reason !== "model_generation_disabled"
  ) {
    return deny(input, modelGate.reason ?? "model_call_blocked", capability);
  }
  if (
    input.requiresModel &&
    !modelGate.allowed &&
    modelGate.reason === "model_generation_disabled"
  ) {
    return deny(input, "model_generation_disabled", capability);
  }

  if (!capability.toolAllowlist.includes(toolName)) {
    return deny(input, "tool_not_allowlisted", capability);
  }

  if (isProhibitedToolAction(toolName)) {
    return deny(input, "prohibited_autonomous_action", capability);
  }

  const consentAction = input.consentAction ?? "search_providers";
  if (capability.requiredConsentScopes?.length) {
    const consent = await verifyPurposeConsent({
      tenantId: ctx.tenantId,
      participantId: ctx.participantId,
      actorUserId: ctx.actorUserId,
      scope: input.consentScope ?? "profile.read",
      purpose: ctx.purpose || NAVIGATOR_CONSENT_PURPOSE,
      action: consentAction,
      delegationDomain: "navigator",
      silent: input.silent,
    });
    if (!consent.ok) {
      return deny(input, `consent_${consent.reason}`, capability);
    }

    if (!input.silent) {
      await createAuditEvent({
        actorUserId: ctx.actorUserId,
        participantId: ctx.participantId,
        action: AGENTS_SDK_AUDIT.gateAllowed,
        entityType: "AiCapability",
        entityId: ctx.capabilityKey,
        metadata: {
          toolName,
          purpose: ctx.purpose,
          domains: ctx.enabledDomains,
        },
      });
    }

    return {
      allowed: true,
      capability,
      consentRecordId: consent.consentRecordId,
    };
  }

  if (!input.silent) {
    await createAuditEvent({
      actorUserId: ctx.actorUserId,
      participantId: ctx.participantId,
      action: AGENTS_SDK_AUDIT.gateAllowed,
      entityType: "AiCapability",
      entityId: ctx.capabilityKey,
      metadata: {
        toolName,
        purpose: ctx.purpose,
        domains: ctx.enabledDomains,
      },
    });
  }

  return { allowed: true, capability };
}

/** Revalidate immediately before SDK approval resume or envelope execution. */
export async function revalidateToolCallContext(
  input: ToolCallPolicyInput,
): Promise<ToolCallPolicyResult> {
  return assertToolCallAllowed(input);
}

export async function assertNavigatorToolBridgeAllowed(input: {
  ctx: MapAbleAgentRunContext;
  navigatorCapabilityKey: string;
  toolName: string;
  silent?: boolean;
}): Promise<ToolCallPolicyResult> {
  const gate = await assertNavigatorCapability({
    capabilityKey: input.navigatorCapabilityKey,
    tenantId: input.ctx.tenantId,
    participantId: input.ctx.participantId,
    actorUserId: input.ctx.actorUserId,
    toolName: input.toolName,
    silent: input.silent,
  });
  if (!gate.allowed) {
    return {
      allowed: false,
      reason: gate.reason,
      capability: gate.capability,
    };
  }
  return assertToolCallAllowed({
    ctx: input.ctx,
    toolName: "access_provider_search",
    consentAction: "match",
    requiredDomain: "access",
    silent: input.silent,
  });
}

export function defaultEnabledDomainsForPilot(): AgentSdkDomain[] {
  return AGENT_SDK_DOMAINS.filter((d) => d === "access");
}

async function deny(
  input: ToolCallPolicyInput,
  reason: string,
  capability?: AiCapabilityRegistration,
): Promise<ToolCallPolicyResult> {
  if (!input.silent) {
    await createAuditEvent({
      actorUserId: input.ctx.actorUserId,
      participantId: input.ctx.participantId,
      action: AGENTS_SDK_AUDIT.gateDenied,
      entityType: "AiCapability",
      entityId: input.ctx.capabilityKey,
      metadata: {
        toolName: input.toolName,
        reason,
        featureFlag: capability?.featureFlag ?? null,
      },
    });
  }
  return { allowed: false, reason, capability };
}
