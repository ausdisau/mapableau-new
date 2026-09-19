/**
 * Bounded agent personas — search, evidence, civic draft, journey.
 */

import { openInfrastructureFlags } from "@/lib/integrations/access/flags";

import {
  AUTHORITY_CAPABILITIES,
  NON_AI_FALLBACK_NOTE,
  type AgentAuthorityLevel,
} from "./authority";
import { canInvokeAgentTool, listToolsForAuthority, type AgentToolId } from "./tools";

export type BoundedAgentId =
  | "search_agent"
  | "evidence_explanation_agent"
  | "civic_drafting_agent"
  | "journey_agent";

export type BoundedAgent = {
  id: BoundedAgentId;
  name: string;
  authorityLevel: AgentAuthorityLevel;
  enabled: boolean;
  fallbackNote: string;
};

export const BOUNDED_AGENTS: BoundedAgent[] = [
  {
    id: "search_agent",
    name: "Access Search Agent",
    authorityLevel: "L0",
    enabled: false,
    fallbackNote: NON_AI_FALLBACK_NOTE,
  },
  {
    id: "evidence_explanation_agent",
    name: "Evidence Explanation Agent",
    authorityLevel: "L1",
    enabled: false,
    fallbackNote: NON_AI_FALLBACK_NOTE,
  },
  {
    id: "civic_drafting_agent",
    name: "Civic Drafting Agent",
    authorityLevel: "L2",
    enabled: false,
    fallbackNote: NON_AI_FALLBACK_NOTE,
  },
  {
    id: "journey_agent",
    name: "Journey Planning Agent",
    authorityLevel: "L2",
    enabled: false,
    fallbackNote: NON_AI_FALLBACK_NOTE,
  },
];

export function getBoundedAgent(id: BoundedAgentId): BoundedAgent | undefined {
  return BOUNDED_AGENTS.find((a) => a.id === id);
}

export function isAgenticAccessEnabled(): boolean {
  return openInfrastructureFlags.agenticAccess;
}

export function resolveAgentWithFlags(agent: BoundedAgent): BoundedAgent {
  return {
    ...agent,
    enabled: isAgenticAccessEnabled() && agent.enabled,
    fallbackNote: isAgenticAccessEnabled()
      ? agent.fallbackNote
      : NON_AI_FALLBACK_NOTE,
  };
}

export function invokeBoundedAgentTool(input: {
  agentId: BoundedAgentId;
  toolId: AgentToolId;
  humanApproved?: boolean;
}): { ok: boolean; message: string } {
  if (!isAgenticAccessEnabled()) {
    return { ok: false, message: "Agentic access disabled" };
  }
  const agent = getBoundedAgent(input.agentId);
  if (!agent) return { ok: false, message: "Unknown agent" };

  const check = canInvokeAgentTool(agent.authorityLevel, input.toolId);
  if (!check.allowed) {
    return { ok: false, message: check.reason ?? "Not allowed" };
  }

  const tool = listToolsForAuthority(agent.authorityLevel).find(
    (t) => t.id === input.toolId,
  );
  if (tool?.requiresHumanApproval && !input.humanApproved) {
    return { ok: false, message: "Human approval required" };
  }

  const caps = AUTHORITY_CAPABILITIES[agent.authorityLevel];
  if (caps.canFabricateEvidence) {
    return { ok: false, message: "Evidence fabrication prohibited" };
  }

  return { ok: true, message: `Tool ${input.toolId} permitted for audit log` };
}
