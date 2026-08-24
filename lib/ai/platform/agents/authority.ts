import type { CareOSAuthorityLevel } from "@/intelligence/network/types";
import { getAiCapability } from "@/lib/ai/platform/capabilities/registry";
import type { AuthorityCeiling } from "@/lib/ai/platform/types/authority";

import { getMapAbleAgent } from "./registry";
import type { MapAbleAgentHandoff, MapAbleAgentId } from "./types";

/** Strictness ranking — lower number = stricter / less operational authority. */
const AUTHORITY_RANK: Record<AuthorityCeiling, number> = {
  NO_OPERATIONAL_AUTHORITY: 0,
  READ_ONLY_EXPLAIN: 1,
  DRAFT_ONLY: 2,
  SUGGEST_WITH_HUMAN_REVIEW: 3,
  SUGGEST_WITH_PARTICIPANT_APPROVAL: 4,
  DETERMINISTIC_EXECUTE_VIA_SERVICE: 5,
};

/**
 * CareOS L0–L3 labels are DISPLAY ONLY, derived from AuthorityCeiling.
 * Never derive global authority from these labels.
 */
export function authorityCeilingToCareOsDisplayLabel(
  ceiling: AuthorityCeiling
): CareOSAuthorityLevel {
  switch (ceiling) {
    case "READ_ONLY_EXPLAIN":
      return "L0_INFORMATION";
    case "DRAFT_ONLY":
      return "L1_DRAFT";
    case "SUGGEST_WITH_HUMAN_REVIEW":
    case "SUGGEST_WITH_PARTICIPANT_APPROVAL":
      return "L2_RECOMMEND";
    case "DETERMINISTIC_EXECUTE_VIA_SERVICE":
      return "L3_CONFIRMED_ACTION";
    case "NO_OPERATIONAL_AUTHORITY": {
      const _exhaustive: "NO_OPERATIONAL_AUTHORITY" = ceiling;
      void _exhaustive;
      return "PROHIBITED";
    }
    default: {
      const _never: never = ceiling;
      void _never;
      return "PROHIBITED";
    }
  }
}

export function compareAuthorityCeiling(
  a: AuthorityCeiling,
  b: AuthorityCeiling
): number {
  return AUTHORITY_RANK[a] - AUTHORITY_RANK[b];
}

export function minAuthority(
  ...ceilings: AuthorityCeiling[]
): AuthorityCeiling {
  if (ceilings.length === 0) {
    return "NO_OPERATIONAL_AUTHORITY";
  }
  return ceilings.reduce((strictest, current) =>
    compareAuthorityCeiling(current, strictest) < 0 ? current : strictest
  );
}

export function agentExceedsCapabilityCeilings(
  agentCeiling: AuthorityCeiling,
  capabilityKeys: string[]
): boolean {
  for (const key of capabilityKeys) {
    const cap = getAiCapability(key);
    if (!cap) continue;
    if (compareAuthorityCeiling(agentCeiling, cap.authorityCeiling) > 0) {
      return true;
    }
  }
  return false;
}

/**
 * effectiveAuthority = min(mission, source agent, target agent, capability)
 * A receiving agent cannot increase authority.
 */
export function effectiveHandoffAuthority(input: {
  missionAuthority: AuthorityCeiling;
  sourceAgentId: MapAbleAgentId;
  targetAgentId: MapAbleAgentId;
  capabilityKey?: string;
}): AuthorityCeiling {
  const source = getMapAbleAgent(input.sourceAgentId);
  const target = getMapAbleAgent(input.targetAgentId);
  const parts: AuthorityCeiling[] = [input.missionAuthority];
  if (source) parts.push(source.authorityCeiling);
  if (target) parts.push(target.authorityCeiling);
  if (input.capabilityKey) {
    const cap = getAiCapability(input.capabilityKey);
    if (cap) parts.push(cap.authorityCeiling);
  }
  return minAuthority(...parts);
}

export function assertHandoffDoesNotRaiseAuthority(
  handoff: MapAbleAgentHandoff,
  capabilityKey?: string
): { ok: true; effective: AuthorityCeiling } | { ok: false; reason: string } {
  const effective = effectiveHandoffAuthority({
    missionAuthority: handoff.authorityCeiling,
    sourceAgentId: handoff.fromAgent,
    targetAgentId: handoff.toAgent,
    capabilityKey,
  });
  if (compareAuthorityCeiling(effective, handoff.authorityCeiling) > 0) {
    return {
      ok: false,
      reason: "handoff_cannot_increase_authority",
    };
  }
  // Target cannot exceed its own ceiling relative to mission either
  const target = getMapAbleAgent(handoff.toAgent);
  if (
    target &&
    compareAuthorityCeiling(handoff.authorityCeiling, target.authorityCeiling) >
      0
  ) {
    return {
      ok: false,
      reason: "handoff_exceeds_target_agent_ceiling",
    };
  }
  return { ok: true, effective };
}
