import { requireAiCapability } from "@/lib/ai/platform/capabilities/registry";
import type { AiCapabilityRegistration } from "@/lib/ai/platform/capabilities/types";
import {
  assertModelCallAllowed,
  isCapabilityKilled,
} from "@/lib/ai/platform/policies/kill-switches";
import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { aiPlatformConfig } from "@/lib/config/ai-platform";
import {
  isRelationalFeatureFlagEnabled,
  isRelationalIntelligenceKilled,
} from "@/lib/config/relational-intelligence";

import { buildRelationalDenialState } from "./denial-ux";
import {
  assertNotProhibitedInference,
  assertNotProhibitedOperational,
  isProhibitedOperationalCapability,
} from "./prohibitions";
import {
  RELATIONAL_POLICY_VERSION,
  isRelationalCapabilityKey,
  type RelationalDenialCode,
  type RelationalGateContext,
  type RelationalGateResult,
} from "./types";

export const RELATIONAL_AUDIT = {
  gateAllowed: "relational.gate.allowed",
  gateDenied: "relational.gate.denied",
  prohibitionBlocked: "relational.prohibition.blocked",
} as const;

async function deny(
  ctx: RelationalGateContext,
  reason: RelationalDenialCode,
  capability?: AiCapabilityRegistration,
): Promise<RelationalGateResult> {
  if (!ctx.silent) {
    await createAuditEvent({
      actorUserId: ctx.actorUserId,
      participantId: ctx.participantId,
      organisationId: ctx.tenantId,
      action: RELATIONAL_AUDIT.gateDenied,
      entityType: "AiCapability",
      entityId: ctx.capabilityKey,
      metadata: {
        reason,
        correlationId: ctx.correlationId ?? null,
        featureFlag: capability?.featureFlag ?? null,
        policyVersion: RELATIONAL_POLICY_VERSION,
      },
    });
  }

  return {
    allowed: false,
    reason,
    denial: buildRelationalDenialState(reason),
    capabilityKey: ctx.capabilityKey,
    policyVersion: RELATIONAL_POLICY_VERSION,
    correlationId: ctx.correlationId,
  };
}

/** Deny-by-default server-side gate. No model or domain-tool calls. */
export async function assertRelationalCapability(
  ctx: RelationalGateContext,
): Promise<RelationalGateResult> {
  if (isProhibitedOperationalCapability(ctx.capabilityKey)) {
    if (!ctx.silent) {
      await createAuditEvent({
        actorUserId: ctx.actorUserId,
        participantId: ctx.participantId,
        organisationId: ctx.tenantId,
        action: RELATIONAL_AUDIT.prohibitionBlocked,
        entityType: "AiCapability",
        entityId: ctx.capabilityKey,
        metadata: {
          reason: "prohibited_operational_capability",
          policyVersion: RELATIONAL_POLICY_VERSION,
        },
      });
    }
    return deny(ctx, "prohibited_operational_capability");
  }

  try {
    assertNotProhibitedOperational(ctx.capabilityKey);
  } catch {
    return deny(ctx, "prohibited_operational_capability");
  }

  let capability: AiCapabilityRegistration;
  try {
    capability = requireAiCapability(ctx.capabilityKey);
  } catch {
    return deny(ctx, "capability_not_registered");
  }

  if (!isRelationalCapabilityKey(ctx.capabilityKey)) {
    return deny(ctx, "not_relational_capability", capability);
  }

  if (ctx.tenantId !== ctx.expectedTenantId) {
    return deny(ctx, "tenant_mismatch", capability);
  }
  if (ctx.participantId !== ctx.expectedParticipantId) {
    return deny(ctx, "participant_mismatch", capability);
  }

  if (aiPlatformConfig.globalKillSwitch) {
    return deny(ctx, "global_kill_switch", capability);
  }
  if (isRelationalIntelligenceKilled()) {
    return deny(ctx, "relational_kill_switch", capability);
  }
  if (
    isCapabilityKilled(ctx.capabilityKey) ||
    isCapabilityKilled(capability.killSwitchKey)
  ) {
    return deny(ctx, "capability_kill_switch", capability);
  }

  if (!isRelationalFeatureFlagEnabled(capability.featureFlag)) {
    return deny(ctx, "feature_flag_disabled", capability);
  }

  for (const scope of capability.requiredConsentScopes ?? []) {
    if (!ctx.grantedConsentScopes.includes(scope)) {
      return deny(ctx, "consent_missing_or_wrong_purpose", capability);
    }
  }

  if (ctx.toolName && !capability.toolAllowlist.includes(ctx.toolName)) {
    return deny(ctx, "tool_not_allowlisted", capability);
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
    const reason: RelationalDenialCode =
      modelGate.reason === "global_kill_switch"
        ? "global_kill_switch"
        : modelGate.reason === "capability_kill_switch"
          ? "capability_kill_switch"
          : "feature_flag_disabled";
    return deny(ctx, reason, capability);
  }

  if (!ctx.silent) {
    await createAuditEvent({
      actorUserId: ctx.actorUserId,
      participantId: ctx.participantId,
      organisationId: ctx.tenantId,
      action: RELATIONAL_AUDIT.gateAllowed,
      entityType: "AiCapability",
      entityId: ctx.capabilityKey,
      metadata: {
        correlationId: ctx.correlationId ?? null,
        featureFlag: capability.featureFlag,
        authorityCeiling: capability.authorityCeiling,
        policyVersion: RELATIONAL_POLICY_VERSION,
      },
    });
  }

  return {
    allowed: true,
    capabilityKey: ctx.capabilityKey,
    authorityCeiling: capability.authorityCeiling,
    policyVersion: RELATIONAL_POLICY_VERSION,
    correlationId: ctx.correlationId,
  };
}

export function rejectProhibitedInference(action: string): void {
  assertNotProhibitedInference(action);
}
