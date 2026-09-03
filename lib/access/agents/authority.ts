/**
 * Agent authority levels L0–L3 for bounded agentic access.
 */

export const AGENT_AUTHORITY_LEVELS = ["L0", "L1", "L2", "L3"] as const;
export type AgentAuthorityLevel = (typeof AGENT_AUTHORITY_LEVELS)[number];

export const AUTHORITY_CAPABILITIES: Record<
  AgentAuthorityLevel,
  {
    label: string;
    canSearch: boolean;
    canExplainEvidence: boolean;
    canDraftCivic: boolean;
    canPlanJourney: boolean;
    canSubmitCivic: boolean;
    canFabricateEvidence: boolean;
  }
> = {
  L0: {
    label: "Read-only search",
    canSearch: true,
    canExplainEvidence: false,
    canDraftCivic: false,
    canPlanJourney: false,
    canSubmitCivic: false,
    canFabricateEvidence: false,
  },
  L1: {
    label: "Evidence explanation",
    canSearch: true,
    canExplainEvidence: true,
    canDraftCivic: false,
    canPlanJourney: false,
    canSubmitCivic: false,
    canFabricateEvidence: false,
  },
  L2: {
    label: "Civic drafting + journey assist",
    canSearch: true,
    canExplainEvidence: true,
    canDraftCivic: true,
    canPlanJourney: true,
    canSubmitCivic: false,
    canFabricateEvidence: false,
  },
  L3: {
    label: "Human-approved civic submit",
    canSearch: true,
    canExplainEvidence: true,
    canDraftCivic: true,
    canPlanJourney: true,
    canSubmitCivic: true,
    canFabricateEvidence: false,
  },
};

export function authorityAllows(
  level: AgentAuthorityLevel,
  capability: Exclude<keyof typeof AUTHORITY_CAPABILITIES.L0, "label">,
): boolean {
  return AUTHORITY_CAPABILITIES[level][capability];
}

export const NON_AI_FALLBACK_NOTE =
  "When AI agents are disabled, use map-independent quest forms and manual civic draft confirmation.";
