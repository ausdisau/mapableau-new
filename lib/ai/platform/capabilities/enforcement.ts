import { requireAiCapability } from "@/lib/ai/platform/capabilities/registry";
import type { AiCapabilityRegistration } from "@/lib/ai/platform/capabilities/types";
import type { DataClass } from "@/lib/ai/platform/types/classification";
import {
  assertModelCallAllowed,
  isCapabilityKilled,
} from "@/lib/ai/platform/policies/kill-switches";
import { aiPlatformConfig } from "@/lib/config/ai-platform";
import { navigatorPilotConfig } from "@/lib/config/navigator-pilot";

export type CapabilityInvocationDenialReason =
  | "capability_not_registered"
  | "capability_kill_switch"
  | "global_kill_switch"
  | "feature_flag_disabled"
  | "tool_not_allowlisted"
  | "data_class_prohibited"
  | "authority_ceiling_exceeded"
  | "human_review_required"
  | "consent_scope_missing"
  | "model_generation_disabled";

export type CapabilityInvocationResult =
  | { allowed: true; capability: AiCapabilityRegistration }
  | {
      allowed: false;
      reason: CapabilityInvocationDenialReason;
      capability?: AiCapabilityRegistration;
    };

const FEATURE_FLAG_RESOLVERS: Record<string, () => boolean> = {
  MAPABLE_NAVIGATOR_PROVIDER_SEARCH_PILOT: () => navigatorPilotConfig.enabled,
  SEARCH_INTERPRETER_ENABLED: () =>
    process.env.SEARCH_INTERPRETER_ENABLED === "true",
  SEARCH_NEEDS_INTERPRETER_LLM: () =>
    process.env.SEARCH_NEEDS_INTERPRETER_LLM === "true",
  SEARCH_AGENT_ENABLED: () => process.env.SEARCH_AGENT_ENABLED === "true",
  DISABILITY_SERVICES_AGENT_ENABLED: () =>
    process.env.DISABILITY_SERVICES_AGENT_ENABLED === "true",
  BOOKING_SERVICES_AGENT_ENABLED: () =>
    process.env.BOOKING_SERVICES_AGENT_ENABLED === "true",
};

const DETERMINISTIC_NAVIGATOR_TOOLS = new Set([
  "search_ndis_providers",
  "apply_hard_constraints",
  "rank_with_participant_weights",
  "create_care_request_draft",
  "transfer_provider_finder_filters",
  "open_human_escalation",
  "project_decision_passport",
]);

function isFeatureFlagEnabled(flagName: string): boolean {
  const resolver = FEATURE_FLAG_RESOLVERS[flagName];
  if (resolver) return resolver();
  return process.env[flagName] === "true";
}

/**
 * Runtime enforcement for declared AI capabilities.
 * Undeclared capabilities and tools are rejected by default.
 */
export function assertCapabilityInvocation(input: {
  capabilityKey: string;
  tenantId?: string | null;
  toolName?: string;
  requestedDataClasses?: DataClass[];
  requestedAuthority?: AiCapabilityRegistration["authorityCeiling"];
  consentScopesPresent?: string[];
  skipFeatureFlagCheck?: boolean;
}): CapabilityInvocationResult {
  let capability: AiCapabilityRegistration;
  try {
    capability = requireAiCapability(input.capabilityKey);
  } catch {
    return { allowed: false, reason: "capability_not_registered" };
  }

  if (aiPlatformConfig.globalKillSwitch) {
    return { allowed: false, reason: "global_kill_switch", capability };
  }

  if (isCapabilityKilled(input.capabilityKey)) {
    return {
      allowed: false,
      reason: "capability_kill_switch",
      capability,
    };
  }

  // Model generation gates apply to model-backed work. Deterministic tools on
  // hybrid capabilities (hard matching, draft envelopes) may still run when
  // only model generation is disabled.
  if (capability.backend !== "deterministic") {
    const modelGate = assertModelCallAllowed({
      capabilityKey: input.capabilityKey,
      tenantId: input.tenantId,
    });
    if (!modelGate.allowed) {
      const isDeterministicTool =
        input.toolName !== undefined &&
        DETERMINISTIC_NAVIGATOR_TOOLS.has(input.toolName);
      if (
        !(
          isDeterministicTool &&
          modelGate.reason === "model_generation_disabled"
        )
      ) {
        const reason =
          modelGate.reason === "global_kill_switch"
            ? "global_kill_switch"
            : modelGate.reason === "model_generation_disabled"
              ? "model_generation_disabled"
              : "capability_kill_switch";
        return { allowed: false, reason, capability };
      }
    }
  }

  if (
    !input.skipFeatureFlagCheck &&
    capability.featureFlag &&
    !isFeatureFlagEnabled(capability.featureFlag)
  ) {
    return { allowed: false, reason: "feature_flag_disabled", capability };
  }

  if (input.toolName) {
    const allow = capability.toolAllowlist ?? [];
    if (allow.length > 0 && !allow.includes(input.toolName)) {
      return { allowed: false, reason: "tool_not_allowlisted", capability };
    }
  }

  if (input.requestedDataClasses?.length) {
    for (const dataClass of input.requestedDataClasses) {
      if (capability.prohibitedDataClasses.includes(dataClass)) {
        return { allowed: false, reason: "data_class_prohibited", capability };
      }
      if (
        capability.permittedDataClasses.length > 0 &&
        !capability.permittedDataClasses.includes(dataClass)
      ) {
        return { allowed: false, reason: "data_class_prohibited", capability };
      }
    }
  }

  const requiredScopes = capability.requiredConsentScopes ?? [];
  if (requiredScopes.length > 0) {
    const present = new Set(input.consentScopesPresent ?? []);
    const missing = requiredScopes.some((scope) => !present.has(scope));
    if (missing) {
      return { allowed: false, reason: "consent_scope_missing", capability };
    }
  }

  return { allowed: true, capability };
}

export function assertToolAllowlisted(
  capabilityKey: string,
  toolName: string,
): void {
  const result = assertCapabilityInvocation({
    capabilityKey,
    toolName,
    skipFeatureFlagCheck: true,
  });
  if (!result.allowed) {
    throw new Error(`AI_TOOL_NOT_ALLOWLISTED:${capabilityKey}:${toolName}`);
  }
}
