/**
 * Serializable Agents SDK context and domain contracts.
 * Never put secrets, raw health notes, or full Prisma rows in this object.
 */

export const MAPABLE_AGENT_DOMAINS = [
  "access",
  "care",
  "transport",
  "jobs",
  "safeguarding",
  "compliance",
] as const;

export type MapAbleAgentDomain = (typeof MAPABLE_AGENT_DOMAINS)[number];

export type MapAbleAgentsContext = {
  tenantId: string;
  participantId: string;
  actorUserId: string;
  capabilityKey: string;
  purpose: string;
  enabledDomains: MapAbleAgentDomain[];
  mcpToolAllowlist: string[];
  sessionId?: string;
  aiOptedOut: boolean;
  /** Optional Iris memory snippets already redacted for the current turn. */
  memorySnippets?: string[];
};

/** Permanent prohibitions — executable in policy, not documentation only. */
export const PERMANENTLY_PROHIBITED_ACTIONS = [
  "book_or_cancel_service",
  "assign_worker_or_driver",
  "approve_or_pay_payment",
  "submit_ndia_claim",
  "change_consent_or_authority",
  "change_participant_records",
  "disclose_sensitive_information",
  "determine_ndis_eligibility_or_funding",
  "make_clinical_recommendation",
  "authorise_restrictive_practice",
  "make_safeguarding_finding",
  "submit_incident_or_regulatory_report",
  "infer_capacity_or_mental_state",
  "auto_assign_worker",
] as const;

export type PermanentlyProhibitedAction =
  (typeof PERMANENTLY_PROHIBITED_ACTIONS)[number];

export type AgentsSdkRunOutcome =
  | {
      status: "completed";
      text: string;
      toolsCalled: string[];
      agentRunId: string | null;
    }
  | {
      status: "needs_approval";
      approvalRecordId: string;
      proposedAction: string;
      summary: string;
    }
  | {
      status: "blocked";
      reason: string;
      toolsCalled: string[];
    };
