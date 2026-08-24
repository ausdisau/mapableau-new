import { requireAiCapability } from "@/lib/ai/platform/capabilities/registry";
import type { AiCapabilityRegistration } from "@/lib/ai/platform/capabilities/types";
import {
  assertModelCallAllowed,
  isCapabilityKilled,
} from "@/lib/ai/platform/policies/kill-switches";
import { PROHIBITED_AUTONOMOUS_ACTIONS } from "@/lib/ai/platform/types/authority";
import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { relationalIntelligenceConfig } from "@/lib/config/relational-intelligence";

export const RELATIONAL_AUDIT = {
  gateAllowed: "relational.gate.allowed",
  gateDenied: "relational.gate.denied",
  prohibitionBlocked: "relational.prohibition.blocked",
  humanHelpRequested: "relational.human_help.requested",
  accessSearchRead: "relational.access.search.read",
} as const;

const RELATIONAL_CAPABILITY_PREFIXES = [
  "relational.",
  "access.search.",
  "human.help.",
] as const;

export type RelationalGateContext = {
  capabilityKey: string;
  tenantId: string;
  participantId: string;
  actorUserId: string;
  toolName?: string;
  silent?: boolean;
};

export type RelationalGateResult =
  | { allowed: true; capability: AiCapabilityRegistration }
  | { allowed: false; reason: string; capability?: AiCapabilityRegistration };

function isRelationalCapabilityKey(key: string): boolean {
  return RELATIONAL_CAPABILITY_PREFIXES.some((prefix) => key.startsWith(prefix));
}

function isFeatureFlagEnabled(flagName: string): boolean {
  if (flagName === "MAPABLE_RELATIONAL_INTELLIGENCE_ENABLED") {
    return relationalIntelligenceConfig.enabled;
  }
  if (flagName === "MAPABLE_RELATIONAL_INTELLIGENCE_MODEL_ASSISTED") {
    return relationalIntelligenceConfig.modelAssistedEnabled;
  }
  if (flagName === "MAPABLE_RELATIONAL_INTELLIGENCE_DRAFT") {
    return relationalIntelligenceConfig.draftEnabled;
  }
  if (flagName === "MAPABLE_RELATIONAL_INTELLIGENCE_ACCESS_SEARCH") {
    return relationalIntelligenceConfig.accessSearchEnabled;
  }
  if (flagName === "MAPABLE_RELATIONAL_INTELLIGENCE_HUMAN_HELP") {
    return relationalIntelligenceConfig.humanHelpEnabled;
  }
  return process.env[flagName] === "true";
}

/**
 * Runtime enforcement for relational.*, access.search.*, and human.help.* capabilities.
 */
export async function assertRelationalCapability(
  ctx: RelationalGateContext,
): Promise<RelationalGateResult> {
  let capability: AiCapabilityRegistration;
  try {
    capability = requireAiCapability(ctx.capabilityKey);
  } catch {
    await denyRelational(ctx, "capability_not_registered");
    return { allowed: false, reason: "capability_not_registered" };
  }

  if (!isRelationalCapabilityKey(ctx.capabilityKey)) {
    await denyRelational(ctx, "not_relational_capability", capability);
    return {
      allowed: false,
      reason: "not_relational_capability",
      capability,
    };
  }

  if (!isFeatureFlagEnabled(capability.featureFlag)) {
    await denyRelational(ctx, "feature_flag_disabled", capability);
    return { allowed: false, reason: "feature_flag_disabled", capability };
  }

  if (
    isCapabilityKilled(ctx.capabilityKey) ||
    isCapabilityKilled(capability.killSwitchKey)
  ) {
    await denyRelational(ctx, "capability_kill_switch", capability);
    return { allowed: false, reason: "capability_kill_switch", capability };
  }

  const modelGate = assertModelCallAllowed({
    capabilityKey: ctx.capabilityKey,
    tenantId: ctx.tenantId,
  });
  if (
    !modelGate.allowed &&
    !(
      capability.backend === "deterministic" &&
      modelGate.reason === "model_generation_disabled"
    )
  ) {
    await denyRelational(ctx, modelGate.reason ?? "model_call_blocked", capability);
    return {
      allowed: false,
      reason: modelGate.reason ?? "model_call_blocked",
      capability,
    };
  }

  if (ctx.toolName && !capability.toolAllowlist.includes(ctx.toolName)) {
    await denyRelational(ctx, "tool_not_allowlisted", capability);
    return { allowed: false, reason: "tool_not_allowlisted", capability };
  }

  if (!ctx.silent) {
    await createAuditEvent({
      actorUserId: ctx.actorUserId,
      participantId: ctx.participantId,
      action: RELATIONAL_AUDIT.gateAllowed,
      entityType: "AiCapability",
      entityId: ctx.capabilityKey,
      metadata: {
        tenantId: ctx.tenantId,
        toolName: ctx.toolName ?? null,
        featureFlag: capability.featureFlag,
      },
    });
  }

  return { allowed: true, capability };
}

export function assertRelationalActionNotProhibited(action: string): void {
  if ((PROHIBITED_AUTONOMOUS_ACTIONS as readonly string[]).includes(action)) {
    throw new Error(`RELATIONAL_PROHIBITED_ACTION:${action}`);
  }
}

export type ProviderFinderGateContext = {
  tenantId: string;
  participantId: string;
  actorUserId: string;
  silent?: boolean;
};

export type ProviderFinderGateResult =
  | { allowed: true; useModelStream: boolean }
  | { allowed: false; reason: string; useDeterministicFallback: boolean };

/**
 * Closes the Provider Finder chat bypass — all replies route through capability gate.
 * Anonymous callers use synthetic ids; deterministic fallback when flag off.
 */
export async function assertProviderFinderChatAllowed(
  ctx: ProviderFinderGateContext,
): Promise<ProviderFinderGateResult> {
  let capability: AiCapabilityRegistration;
  try {
    capability = requireAiCapability("provider_finder.reply_generator");
  } catch {
    return {
      allowed: false,
      reason: "capability_not_registered",
      useDeterministicFallback: true,
    };
  }

  if (
    isCapabilityKilled("provider_finder.reply_generator") ||
    isCapabilityKilled(capability.killSwitchKey)
  ) {
    return {
      allowed: false,
      reason: "capability_kill_switch",
      useDeterministicFallback: true,
    };
  }

  const flagOn = process.env.SEARCH_AGENT_ENABLED === "true";
  if (!flagOn) {
    return {
      allowed: false,
      reason: "feature_flag_disabled",
      useDeterministicFallback: true,
    };
  }

  const modelGate = assertModelCallAllowed({
    capabilityKey: "provider_finder.reply_generator",
    tenantId: ctx.tenantId,
  });
  if (!modelGate.allowed) {
    return {
      allowed: false,
      reason: modelGate.reason ?? "model_call_blocked",
      useDeterministicFallback: true,
    };
  }

  if (!ctx.silent) {
    await createAuditEvent({
      actorUserId: ctx.actorUserId,
      participantId: ctx.participantId,
      action: RELATIONAL_AUDIT.gateAllowed,
      entityType: "AiCapability",
      entityId: "provider_finder.reply_generator",
      metadata: { tenantId: ctx.tenantId, surface: "provider_finder_chat" },
    });
  }

  return { allowed: true, useModelStream: true };
}

async function denyRelational(
  ctx: RelationalGateContext,
  reason: string,
  capability?: AiCapabilityRegistration,
): Promise<void> {
  if (ctx.silent) return;
  await createAuditEvent({
    actorUserId: ctx.actorUserId,
    participantId: ctx.participantId,
    action: RELATIONAL_AUDIT.gateDenied,
    entityType: "AiCapability",
    entityId: ctx.capabilityKey,
    metadata: {
      tenantId: ctx.tenantId,
      reason,
      toolName: ctx.toolName ?? null,
      featureFlag: capability?.featureFlag ?? null,
    },
  });
}
