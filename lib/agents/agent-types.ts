export type MapAbleAgentId =
  | "participant_support"
  | "provider_operations"
  | "quality_safeguards"
  | "billing_pricing"
  | "provider_finder"
  | "transport_dispatch"
  | "telehealth_intake"
  | "evidence_pack"
  | "support_desk"
  | "privacy_consent"
  | "admin_copilot"
  | "orchestrator";

export type AgentRiskLevel = "low" | "medium" | "high" | "critical";

export type AgentActionStatus =
  | "drafted"
  | "requires_confirmation"
  | "requires_human_review"
  | "blocked"
  | "completed";

export type AgentContext = {
  userId: string;
  profileId: string;
  role: string;
  organisationId?: string;
  participantId?: string;
  sessionId: string;
  consentScopes: string[];
  permissions: string[];
  featureFlags: Record<string, boolean>;
};

export type AgentRunRequest = {
  agentId?: MapAbleAgentId;
  message: string;
  context: AgentContext;
  conversationId?: string;
  attachments?: Array<{
    documentId: string;
    purpose: string;
  }>;
};

export type AgentToolCallSummary = {
  toolName: string;
  status: string;
  riskLevel: AgentRiskLevel;
  outputSummary?: string;
  blockedReason?: string;
};

export type AgentRunResult = {
  agentId: MapAbleAgentId;
  response: string;
  structuredOutput?: unknown;
  toolCalls: AgentToolCallSummary[];
  actionStatus: AgentActionStatus;
  requiresHumanConfirmation: boolean;
  auditEventId?: string;
  runId?: string;
  conversationId?: string;
};

export const MAPABLE_INVOCATION_STATE_KEY = "mapableAgent";

export type MapAbleInvocationState = {
  context: AgentContext;
  runId: string;
  agentId: MapAbleAgentId;
  toolCalls: AgentToolCallSummary[];
  requiresHumanConfirmation: boolean;
  actionStatus: AgentActionStatus;
};

export const HIGH_RISK_TOOL_NAMES = new Set([
  "approve_invoice",
  "submit_ndis_claim",
  "close_incident",
  "assign_high_risk_worker",
  "submit_complaint_external",
  "submit_incident_external",
  "change_payment_details",
  "change_roles_permissions",
  "mark_service_delivered",
  "execute_booking",
  "reveal_full_participant_record",
]);

export const DRAFT_ONLY_TOOL_SUFFIX = "_draft_only";

export const FORBIDDEN_EXECUTE_TOOLS = new Set([
  "approve_invoice",
  "submit_ndis_claim",
  "close_incident",
  "assign_high_risk_worker",
  "reveal_full_participant_record",
  "change_payment_details",
  "change_roles_permissions",
]);
