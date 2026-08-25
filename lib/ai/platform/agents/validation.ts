import { getAiCapability } from "@/lib/ai/platform/capabilities/registry";
import { assertApprovalBindingComplete } from "@/lib/ai/platform/human-review/contracts";
import type { ProposalApprovalBinding } from "@/lib/ai/platform/human-review/contracts";
import {
  PROHIBITED_AUTONOMOUS_ACTIONS,
  type AuthorityCeiling,
} from "@/lib/ai/platform/types/authority";

import {
  compareAuthorityCeiling,
  minAuthority,
} from "./authority";
import { MAPABLE_AGENT_MANIFESTS } from "./manifests";
import { listMapAbleAgents } from "./registry";
import {
  MAPABLE_OPERATIONAL_AGENT_IDS,
  type MapAbleAgentId,
  type MapAbleAgentManifest,
} from "./types";

export type AgentRegistryValidationIssue = {
  code: string;
  message: string;
  agentId?: MapAbleAgentId;
  capabilityKey?: string;
};

export type AgentRegistryValidationResult = {
  ok: boolean;
  issues: AgentRegistryValidationIssue[];
};

function maxAuthority(...ceilings: AuthorityCeiling[]): AuthorityCeiling {
  if (ceilings.length === 0) return "NO_OPERATIONAL_AUTHORITY";
  return ceilings.reduce((highest, current) =>
    compareAuthorityCeiling(current, highest) > 0 ? current : highest
  );
}

/**
 * Fail-closed validation of the canonical agent registry.
 * Call at test time and from Convergence OS preflight helpers.
 */
export function validateMapAbleAgentRegistry(): AgentRegistryValidationResult {
  const issues: AgentRegistryValidationIssue[] = [];
  const agents = listMapAbleAgents();
  const seen = new Set<string>();

  if (agents.length !== MAPABLE_OPERATIONAL_AGENT_IDS.length) {
    issues.push({
      code: "operational_agent_count",
      message: `Expected exactly ${MAPABLE_OPERATIONAL_AGENT_IDS.length} operational agents, found ${agents.length}`,
    });
  }

  for (const expected of MAPABLE_OPERATIONAL_AGENT_IDS) {
    if (!agents.some((a) => a.id === expected)) {
      issues.push({
        code: "missing_operational_agent",
        message: `Missing canonical operational agent: ${expected}`,
        agentId: expected,
      });
    }
  }

  for (const agent of agents) {
    if (seen.has(agent.id)) {
      issues.push({
        code: "duplicate_agent_id",
        message: `Duplicate agent ID: ${agent.id}`,
        agentId: agent.id,
      });
    }
    seen.add(agent.id);

    // 1. every capabilityKey exists
    for (const key of agent.capabilityKeys) {
      const cap = getAiCapability(key);
      if (!cap) {
        issues.push({
          code: "unknown_capability",
          message: `Agent ${agent.id} references unknown capability ${key}`,
          agentId: agent.id,
          capabilityKey: key,
        });
        continue;
      }

      // 4. every model-backed capability retains a kill switch
      if (
        (cap.backend === "model_backed" || cap.backend === "hybrid") &&
        !cap.killSwitchKey
      ) {
        issues.push({
          code: "missing_kill_switch",
          message: `Model-backed capability ${key} lacks killSwitchKey`,
          agentId: agent.id,
          capabilityKey: key,
        });
      }
    }

    // 3. agent must not exceed the highest authority any of its capabilities allow
    const capCeilings = agent.capabilityKeys
      .map((k) => getAiCapability(k)?.authorityCeiling)
      .filter((c): c is AuthorityCeiling => Boolean(c));
    if (capCeilings.length > 0) {
      const maxCap = maxAuthority(...capCeilings);
      if (compareAuthorityCeiling(agent.authorityCeiling, maxCap) > 0) {
        issues.push({
          code: "authority_exceeds_capabilities",
          message: `Agent ${agent.id} ceiling ${agent.authorityCeiling} exceeds max capability ceiling ${maxCap}`,
          agentId: agent.id,
        });
      }
    }

    // 9. every operational agent has an evaluation suite
    if (!agent.evaluationSuite || agent.evaluationSuite.trim() === "") {
      issues.push({
        code: "missing_evaluation_suite",
        message: `Agent ${agent.id} missing evaluationSuite`,
        agentId: agent.id,
      });
    }

    // 10. every agent has a deterministic or human fallback
    if (!agent.fallbackAgentId) {
      issues.push({
        code: "missing_fallback",
        message: `Agent ${agent.id} missing fallbackAgentId`,
        agentId: agent.id,
      });
    } else if (
      agent.fallbackAgentId !== "human" &&
      agent.fallbackAgentId !== "non_ai_path" &&
      agent.fallbackAgentId !== agent.id
    ) {
      const fb = agents.find((a) => a.id === agent.fallbackAgentId);
      if (!fb && !MAPABLE_OPERATIONAL_AGENT_IDS.includes(agent.fallbackAgentId)) {
        issues.push({
          code: "invalid_fallback",
          message: `Agent ${agent.id} fallback ${agent.fallbackAgentId} is unknown`,
          agentId: agent.id,
        });
      }
    }

    // 6. prohibited autonomous actions remain prohibited globally
    for (const action of agent.prohibitedActions) {
      if (
        !(PROHIBITED_AUTONOMOUS_ACTIONS as readonly string[]).includes(action)
      ) {
        issues.push({
          code: "unknown_prohibited_action",
          message: `Agent ${agent.id} lists unknown prohibited action ${action}`,
          agentId: agent.id,
        });
      }
    }
  }

  // Extra: roles must be unique among operational agents
  const roles = new Set<string>();
  for (const agent of agents) {
    if (roles.has(agent.role)) {
      issues.push({
        code: "duplicate_agent_role",
        message: `Duplicate agent role: ${agent.role}`,
        agentId: agent.id,
      });
    }
    roles.add(agent.role);
  }

  return { ok: issues.length === 0, issues };
}

export function assertMapAbleAgentRegistryValid(): void {
  const result = validateMapAbleAgentRegistry();
  if (!result.ok) {
    const detail = result.issues
      .map((i) => `${i.code}:${i.message}`)
      .join("; ");
    throw new Error(`MAPABLE_AGENT_REGISTRY_INVALID:${detail}`);
  }
}

/** Participant-approval capabilities cannot execute without a valid approval binding. */
export function assertParticipantApprovalBinding(input: {
  capabilityKey: string;
  binding: ProposalApprovalBinding | null | undefined;
}): { ok: true } | { ok: false; reason: string } {
  const cap = getAiCapability(input.capabilityKey);
  if (!cap) {
    return { ok: false, reason: "unknown_capability" };
  }
  if (!cap.participantApprovalRequired) {
    return { ok: true };
  }
  if (!input.binding || !assertApprovalBindingComplete(input.binding)) {
    return { ok: false, reason: "participant_approval_binding_required" };
  }
  return { ok: true };
}

/** Human-only workflows cannot be downgraded by agent handoff. */
export function isHumanOnlyWorkflow(category: string): boolean {
  return (
    category === "safeguarding" ||
    category === "clinical_exception" ||
    category === "legal_exception" ||
    category === "restrictive_practice"
  );
}

export function assertHandoffPreservesHumanOnly(input: {
  category: string;
  targetAgentId: MapAbleAgentId;
}): { ok: true } | { ok: false; reason: string } {
  if (!isHumanOnlyWorkflow(input.category)) {
    return { ok: true };
  }
  return {
    ok: false,
    reason: "human_only_workflow_cannot_be_handed_to_agent",
  };
}

export function resolveAgentEffectiveCeiling(
  agent: MapAbleAgentManifest
): AuthorityCeiling {
  const caps = agent.capabilityKeys
    .map((k) => getAiCapability(k)?.authorityCeiling)
    .filter((c): c is AuthorityCeiling => Boolean(c));
  return minAuthority(agent.authorityCeiling, ...caps);
}

/** Manifests frozen reference for preflight duplicate checks. */
export function getSeededAgentManifestCount(): number {
  return MAPABLE_AGENT_MANIFESTS.length;
}
