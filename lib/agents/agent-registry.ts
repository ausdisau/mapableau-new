import type { AgentRiskLevel, MapAbleAgentId } from "./agent-types";
import type { UserRole } from "@/types/mapable";

export type AgentConfig = {
  id: MapAbleAgentId;
  displayName: string;
  description: string;
  systemPrompt: string;
  allowedTools: string[];
  forbiddenTools: string[];
  riskLevel: AgentRiskLevel;
  allowedRoles: UserRole[];
  requiresConsentScopes: string[];
  canStream: boolean;
  canUseDocuments: boolean;
  canDraftActions: boolean;
  canExecuteActions: boolean;
  temperature: number;
};

const BASE_SAFETY_RULES = `
You are a MapAble assistant for an accessibility-first disability services ecosystem.
You may draft, explain, summarise, classify and prepare actions only.
You must never approve invoices, submit NDIS claims, make clinical decisions, close incidents,
assign high-risk workers, reveal private participant information without consent,
bypass verification gates, change payment details, or change roles.
Use plain language. If an action needs a human, say so clearly.
`;

const REGISTRY: Record<MapAbleAgentId, AgentConfig> = {
  participant_support: {
    id: "participant_support",
    displayName: "Participant support",
    description: "Bookings, invoices, consent, complaints and provider discovery for participants.",
    systemPrompt: `${BASE_SAFETY_RULES} Help participants understand bookings, invoices, service agreements, consent and complaints. Draft support requests only.`,
    allowedTools: [
      "get_participant_profile_summary",
      "get_participant_access_needs_summary",
      "get_participant_consent_status",
      "get_participant_timeline_summary",
      "get_upcoming_bookings",
      "draft_booking_request",
      "check_booking_eligibility",
      "create_booking_draft_only",
      "get_invoice_summary",
      "explain_invoice",
      "draft_invoice_dispute",
      "search_providers",
      "get_provider_public_profile",
      "draft_complaint",
      "create_complaint_draft_only",
      "check_consent_scope",
      "explain_consent_scope",
    ],
    forbiddenTools: ["approve_invoice", "close_incident", "submit_ndis_claim"],
    riskLevel: "medium",
    allowedRoles: ["participant", "family_member", "mapable_admin"],
    requiresConsentScopes: [],
    canStream: true,
    canUseDocuments: true,
    canDraftActions: true,
    canExecuteActions: false,
    temperature: 0.3,
  },
  provider_operations: {
    id: "provider_operations",
    displayName: "Provider operations",
    description: "Provider bookings, workforce, service logs and quality operations.",
    systemPrompt: `${BASE_SAFETY_RULES} Help provider staff manage bookings, workers, service logs and invoices. Respect participant consent.`,
    allowedTools: [
      "get_provider_verification_summary",
      "get_upcoming_bookings",
      "get_quality_action_queue",
      "get_invoice_summary",
      "run_invoice_validation",
      "check_booking_eligibility",
      "draft_booking_request",
      "log_agent_event",
    ],
    forbiddenTools: ["approve_invoice", "mark_service_delivered", "assign_high_risk_worker"],
    riskLevel: "medium",
    allowedRoles: ["provider_admin", "support_worker", "transport_operator", "mapable_admin"],
    requiresConsentScopes: [],
    canStream: true,
    canUseDocuments: true,
    canDraftActions: true,
    canExecuteActions: false,
    temperature: 0.2,
  },
  quality_safeguards: {
    id: "quality_safeguards",
    displayName: "Quality & safeguards",
    description: "Triage complaints and incidents; draft corrective actions only.",
    systemPrompt: `${BASE_SAFETY_RULES} Triage complaints and incidents. Classify risk and draft actions. Never close incidents or decide reportability without human review.`,
    allowedTools: [
      "get_quality_action_queue",
      "draft_incident_report",
      "classify_incident_risk",
      "draft_complaint",
      "draft_continuous_improvement_action",
      "create_human_approval_request",
    ],
    forbiddenTools: ["close_incident", "submit_incident_external"],
    riskLevel: "high",
    allowedRoles: ["provider_admin", "mapable_admin", "support_coordinator"],
    requiresConsentScopes: [],
    canStream: true,
    canUseDocuments: false,
    canDraftActions: true,
    canExecuteActions: false,
    temperature: 0.1,
  },
  billing_pricing: {
    id: "billing_pricing",
    displayName: "Billing & pricing",
    description: "Explain invoices and NDIS pricing; validate claims without submitting.",
    systemPrompt: `${BASE_SAFETY_RULES} Explain invoices and pricing in plain language. Run validation only. Never approve payments or submit claims.`,
    allowedTools: [
      "get_invoice_summary",
      "explain_invoice",
      "run_invoice_validation",
      "draft_invoice_dispute",
      "lookup_support_item",
      "estimate_service_quote",
    ],
    forbiddenTools: ["approve_invoice", "submit_ndis_claim", "change_payment_details"],
    riskLevel: "medium",
    allowedRoles: ["participant", "plan_manager", "provider_admin", "mapable_admin"],
    requiresConsentScopes: [],
    canStream: true,
    canUseDocuments: false,
    canDraftActions: true,
    canExecuteActions: false,
    temperature: 0.2,
  },
  provider_finder: {
    id: "provider_finder",
    displayName: "Provider finder",
    description: "Search and compare verified providers.",
    systemPrompt: `${BASE_SAFETY_RULES} Help users find suitable providers using public and consented information only.`,
    allowedTools: ["search_providers", "get_provider_public_profile", "check_booking_eligibility"],
    forbiddenTools: ["reveal_full_participant_record"],
    riskLevel: "low",
    allowedRoles: ["participant", "family_member", "support_coordinator", "mapable_admin"],
    requiresConsentScopes: [],
    canStream: true,
    canUseDocuments: false,
    canDraftActions: true,
    canExecuteActions: false,
    temperature: 0.4,
  },
  transport_dispatch: {
    id: "transport_dispatch",
    displayName: "Transport dispatch",
    description: "Accessible transport planning drafts only.",
    systemPrompt: `${BASE_SAFETY_RULES} Help plan accessible transport. Check eligibility. Draft bookings only.`,
    allowedTools: ["draft_booking_request", "check_booking_eligibility", "get_upcoming_bookings"],
    forbiddenTools: ["assign_high_risk_worker"],
    riskLevel: "medium",
    allowedRoles: ["participant", "transport_operator", "driver", "mapable_admin"],
    requiresConsentScopes: [],
    canStream: true,
    canUseDocuments: false,
    canDraftActions: true,
    canExecuteActions: false,
    temperature: 0.3,
  },
  telehealth_intake: {
    id: "telehealth_intake",
    displayName: "Telehealth intake",
    description: "Pre-session intake and practitioner review summaries only.",
    systemPrompt: `${BASE_SAFETY_RULES} Collect intake information and summarise for practitioner review. Never diagnose or recommend treatment.`,
    allowedTools: ["draft_telehealth_intake", "get_participant_access_needs_summary", "check_consent_scope"],
    forbiddenTools: [],
    riskLevel: "medium",
    allowedRoles: ["participant", "mapable_admin"],
    requiresConsentScopes: ["profile.read"],
    canStream: true,
    canUseDocuments: true,
    canDraftActions: true,
    canExecuteActions: false,
    temperature: 0.2,
  },
  evidence_pack: {
    id: "evidence_pack",
    displayName: "Evidence pack",
    description: "Draft plan review evidence packs for human review.",
    systemPrompt: `${BASE_SAFETY_RULES} Assemble evidence pack drafts from consented sources. Mark outputs as needing human review.`,
    allowedTools: [
      "get_participant_timeline_summary",
      "get_invoice_summary",
      "check_consent_scope",
      "log_agent_event",
    ],
    forbiddenTools: [],
    riskLevel: "medium",
    allowedRoles: ["participant", "support_coordinator", "plan_manager", "mapable_admin"],
    requiresConsentScopes: [],
    canStream: true,
    canUseDocuments: true,
    canDraftActions: true,
    canExecuteActions: false,
    temperature: 0.2,
  },
  support_desk: {
    id: "support_desk",
    displayName: "Support desk",
    description: "General support tickets and service recovery guidance.",
    systemPrompt: `${BASE_SAFETY_RULES} Help with support tickets and service recovery. Escalate safeguarding concerns to quality workflows.`,
    allowedTools: [
      "draft_complaint",
      "create_complaint_draft_only",
      "draft_booking_request",
      "get_upcoming_bookings",
      "create_human_approval_request",
    ],
    forbiddenTools: ["close_incident"],
    riskLevel: "medium",
    allowedRoles: ["participant", "family_member", "support_coordinator", "mapable_admin"],
    requiresConsentScopes: [],
    canStream: true,
    canUseDocuments: false,
    canDraftActions: true,
    canExecuteActions: false,
    temperature: 0.3,
  },
  privacy_consent: {
    id: "privacy_consent",
    displayName: "Privacy & consent",
    description: "Explain consent scopes and data sharing.",
    systemPrompt: `${BASE_SAFETY_RULES} Explain what data can be shared under each consent scope. Never grant consent on behalf of users.`,
    allowedTools: ["check_consent_scope", "explain_consent_scope", "get_participant_consent_status"],
    forbiddenTools: [],
    riskLevel: "low",
    allowedRoles: ["participant", "family_member", "support_coordinator", "mapable_admin"],
    requiresConsentScopes: [],
    canStream: true,
    canUseDocuments: false,
    canDraftActions: false,
    canExecuteActions: false,
    temperature: 0.2,
  },
  admin_copilot: {
    id: "admin_copilot",
    displayName: "Admin copilot",
    description: "Internal admin summaries with strict boundaries.",
    systemPrompt: `${BASE_SAFETY_RULES} Assist MapAble administrators with operational summaries. Redact PII in responses.`,
    allowedTools: ["get_quality_action_queue", "log_agent_event"],
    forbiddenTools: ["change_roles_permissions", "approve_invoice"],
    riskLevel: "high",
    allowedRoles: ["mapable_admin"],
    requiresConsentScopes: [],
    canStream: true,
    canUseDocuments: false,
    canDraftActions: true,
    canExecuteActions: false,
    temperature: 0.1,
  },
  orchestrator: {
    id: "orchestrator",
    displayName: "Orchestrator",
    description: "Routes requests to specialist agents.",
    systemPrompt: `${BASE_SAFETY_RULES} Route the user to the best specialist agent. Return structured routing only.`,
    allowedTools: [],
    forbiddenTools: [],
    riskLevel: "low",
    allowedRoles: [
      "participant",
      "family_member",
      "provider_admin",
      "support_coordinator",
      "plan_manager",
      "mapable_admin",
    ],
    requiresConsentScopes: [],
    canStream: false,
    canUseDocuments: false,
    canDraftActions: false,
    canExecuteActions: false,
    temperature: 0,
  },
};

export function getAgentConfig(agentId: MapAbleAgentId): AgentConfig {
  return REGISTRY[agentId];
}

export function listAgentConfigs(): AgentConfig[] {
  return Object.values(REGISTRY);
}

export function isAgentEnabledForRole(
  agentId: MapAbleAgentId,
  role: string
): boolean {
  const config = REGISTRY[agentId];
  return config.allowedRoles.includes(role as UserRole) || role === "mapable_admin";
}
