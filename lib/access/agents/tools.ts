import type { AgentAuthorityLevel } from "./authority";
import { authorityAllows } from "./authority";

export const AGENT_TOOL_IDS = [
  "search_access_places",
  "explain_evidence",
  "draft_civic_issue",
  "plan_journey",
  "submit_civic_issue",
] as const;

export type AgentToolId = (typeof AGENT_TOOL_IDS)[number];

export type AgentToolDefinition = {
  id: AgentToolId;
  description: string;
  minAuthority: AgentAuthorityLevel;
  requiresHumanApproval: boolean;
  auditRequired: boolean;
  permissionKey: string;
};

export const AGENT_TOOLS: AgentToolDefinition[] = [
  {
    id: "search_access_places",
    description: "Search public access place listings",
    minAuthority: "L0",
    requiresHumanApproval: false,
    auditRequired: true,
    permissionKey: "access.search",
  },
  {
    id: "explain_evidence",
    description: "Explain evidence provenance without fabricating data",
    minAuthority: "L1",
    requiresHumanApproval: false,
    auditRequired: true,
    permissionKey: "access.evidence.explain",
  },
  {
    id: "draft_civic_issue",
    description: "Draft civic issue for human review — no autonomous submit",
    minAuthority: "L2",
    requiresHumanApproval: true,
    auditRequired: true,
    permissionKey: "access.civic.draft",
  },
  {
    id: "plan_journey",
    description: "Plan journey with unknown-segment warnings",
    minAuthority: "L2",
    requiresHumanApproval: false,
    auditRequired: true,
    permissionKey: "access.journey.plan",
  },
  {
    id: "submit_civic_issue",
    description: "Submit civic issue after explicit human confirmation",
    minAuthority: "L3",
    requiresHumanApproval: true,
    auditRequired: true,
    permissionKey: "access.civic.submit",
  },
];

const LEVEL_ORDER: AgentAuthorityLevel[] = ["L0", "L1", "L2", "L3"];

export function levelMeetsMinimum(
  level: AgentAuthorityLevel,
  min: AgentAuthorityLevel,
): boolean {
  return LEVEL_ORDER.indexOf(level) >= LEVEL_ORDER.indexOf(min);
}

export function canInvokeAgentTool(
  level: AgentAuthorityLevel,
  toolId: AgentToolId,
): { allowed: boolean; reason?: string } {
  const tool = AGENT_TOOLS.find((t) => t.id === toolId);
  if (!tool) return { allowed: false, reason: "Unknown tool" };

  if (!levelMeetsMinimum(level, tool.minAuthority)) {
    return {
      allowed: false,
      reason: `Requires authority ${tool.minAuthority}`,
    };
  }

  if (toolId === "submit_civic_issue") {
    if (!authorityAllows(level, "canSubmitCivic")) {
      return {
        allowed: false,
        reason: "Civic submit requires L3 with human approval",
      };
    }
  }

  if (authorityAllows(level, "canFabricateEvidence")) {
    return { allowed: false, reason: "Evidence fabrication prohibited" };
  }

  return { allowed: true };
}

export function listToolsForAuthority(level: AgentAuthorityLevel): AgentToolDefinition[] {
  return AGENT_TOOLS.filter((tool) =>
    levelMeetsMinimum(level, tool.minAuthority),
  );
}
