import type { AgentRiskLevel } from "../agent-types";

export type ToolPolicy = {
  name: string;
  riskLevel: AgentRiskLevel;
  permission?: string;
  consentScope?: string;
  draftOnly?: boolean;
  requiresConfirmation?: boolean;
  blocked?: boolean;
};

export const TOOL_POLICIES: Record<string, ToolPolicy> = {
  get_participant_profile_summary: { name: "get_participant_profile_summary", riskLevel: "medium", permission: "profile:read:self" },
  get_participant_access_needs_summary: { name: "get_participant_access_needs_summary", riskLevel: "medium", permission: "accessibility:read:self" },
  get_participant_consent_status: { name: "get_participant_consent_status", riskLevel: "low", permission: "consent:manage:self" },
  get_participant_timeline_summary: { name: "get_participant_timeline_summary", riskLevel: "medium", permission: "booking:read:self" },
  search_providers: { name: "search_providers", riskLevel: "low", permission: "search:providers" },
  get_provider_public_profile: { name: "get_provider_public_profile", riskLevel: "low", permission: "search:providers" },
  get_provider_verification_summary: { name: "get_provider_verification_summary", riskLevel: "low", permission: "care:read:org" },
  get_upcoming_bookings: { name: "get_upcoming_bookings", riskLevel: "low", permission: "booking:read:self" },
  draft_booking_request: { name: "draft_booking_request", riskLevel: "medium", permission: "booking:create", draftOnly: true },
  check_booking_eligibility: { name: "check_booking_eligibility", riskLevel: "low", permission: "booking:create" },
  create_booking_draft_only: { name: "create_booking_draft_only", riskLevel: "medium", permission: "booking:create", draftOnly: true, requiresConfirmation: true },
  get_invoice_summary: { name: "get_invoice_summary", riskLevel: "medium", permission: "invoice:read:self" },
  explain_invoice: { name: "explain_invoice", riskLevel: "low", permission: "invoice:read:self" },
  run_invoice_validation: { name: "run_invoice_validation", riskLevel: "medium", permission: "invoice:read:org" },
  draft_invoice_dispute: { name: "draft_invoice_dispute", riskLevel: "medium", draftOnly: true },
  approve_invoice: { name: "approve_invoice", riskLevel: "critical", blocked: true },
  lookup_support_item: { name: "lookup_support_item", riskLevel: "low" },
  estimate_service_quote: { name: "estimate_service_quote", riskLevel: "low" },
  get_quality_action_queue: { name: "get_quality_action_queue", riskLevel: "medium", permission: "provider_quality:read" },
  draft_continuous_improvement_action: { name: "draft_continuous_improvement_action", riskLevel: "medium", draftOnly: true },
  draft_incident_report: { name: "draft_incident_report", riskLevel: "high", permission: "incident:create", draftOnly: true },
  classify_incident_risk: { name: "classify_incident_risk", riskLevel: "medium", permission: "incident:read:self" },
  close_incident: { name: "close_incident", riskLevel: "critical", blocked: true },
  draft_complaint: { name: "draft_complaint", riskLevel: "high", draftOnly: true },
  create_complaint_draft_only: { name: "create_complaint_draft_only", riskLevel: "high", draftOnly: true, requiresConfirmation: true },
  draft_telehealth_intake: { name: "draft_telehealth_intake", riskLevel: "medium", draftOnly: true },
  check_consent_scope: { name: "check_consent_scope", riskLevel: "low", permission: "consent:manage:self" },
  explain_consent_scope: { name: "explain_consent_scope", riskLevel: "low" },
  log_agent_event: { name: "log_agent_event", riskLevel: "low" },
  create_human_approval_request: { name: "create_human_approval_request", riskLevel: "medium" },
};

export function getToolPolicy(toolName: string): ToolPolicy {
  return (
    TOOL_POLICIES[toolName] ?? {
      name: toolName,
      riskLevel: "medium",
    }
  );
}
