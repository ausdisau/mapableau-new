import type { MapAbleModule } from "@/intelligence/types";
import type {
  MapAbleAgentActivationEntry,
  MapAbleAgentId,
  MapAbleHumanReviewItem,
  MapAbleMissionContext,
} from "@/lib/ai/platform/agents/types";
import type { ProposalApprovalBinding } from "@/lib/ai/platform/human-review/contracts";
import type { AuthorityCeiling } from "@/lib/ai/platform/types/authority";

export const MISSION_SOURCES = [
  "participant_text",
  "life_intent",
  "care",
  "transport",
  "jobs",
  "access",
  "support_coordinator",
] as const;

export type MissionSource = (typeof MISSION_SOURCES)[number];

export const MISSION_NODE_TYPES = [
  "goal",
  "life_intent",
  "event",
  "care_support",
  "transport",
  "accessibility",
  "job",
  "employer",
  "provider",
  "worker",
  "funding",
  "approval",
  "evidence",
  "contingency",
  "human_review",
] as const;

export type MissionNodeType = (typeof MISSION_NODE_TYPES)[number];

/** Preserves materially distinct states — never collapse to "missing". */
export const MISSION_NODE_STATUSES = [
  "confirmed",
  "available",
  "missing",
  "needs_review",
  "not_authorised",
  "consent_required",
  "disabled",
  "unavailable",
] as const;

export type MissionNodeStatus = (typeof MISSION_NODE_STATUSES)[number];

export const EVIDENCE_ORIGINS = [
  "participant_input",
  "participant_profile",
  "life_intent",
  "system_record",
  "provider_record",
  "access_observation",
  "calendar",
  "public_evidence",
  "model_inference",
] as const;

export type EvidenceOrigin = (typeof EVIDENCE_ORIGINS)[number];

export const MISSION_PLAN_STATUSES = [
  "ready",
  "needs_information",
  "needs_participant_decision",
  "human_review_required",
  "blocked",
] as const;

export type MissionPlanStatus = (typeof MISSION_PLAN_STATUSES)[number];

export const MISSION_ACTION_TYPES = [
  "prepare_transport_request",
  "prepare_care_request",
  "prepare_provider_message",
  "prepare_adjustment_request",
  "request_human_coordination",
] as const;

export type MissionActionType = (typeof MISSION_ACTION_TYPES)[number];

export type MapAbleMissionRequest = {
  missionId: string;
  actorId: string;
  participantId: string;
  objective: string;
  lifeIntentId?: string;
  requestedDomains?: MapAbleModule[];
  communicationPreferences?: string[];
  requestedUseOfAccessibilityProfile: boolean;
  plainLanguage: boolean;
  consentScopes: string[];
  source: MissionSource;
  /** Participant-editable domain overrides */
  addedDomains?: MapAbleModule[];
  removedDomains?: MapAbleModule[];
  /** When false, profile refs are not loaded */
  profileConsentGranted?: boolean;
  traceId: string;
};

export type MissionRoutingResult = {
  requestedDomains: MapAbleModule[];
  inferredDomains: MapAbleModule[];
  allowedDomains: MapAbleModule[];
  rejectedDomains: MapAbleModule[];
  reasons: Record<string, string>;
};

export type MissionGraphNode = {
  id: string;
  type: MissionNodeType;
  label: string;
  status: MissionNodeStatus;
  sourceDomain: MapAbleModule;
  recordId: string | null;
  details: string;
  evidenceRefs: string[];
  confidence: number | null;
  limitations: string[];
};

export type MissionGraphEdge = {
  id: string;
  fromId: string;
  toId: string;
  label: string;
  dependencyKind: "requires" | "informs" | "blocks";
};

export type MissionGraph = {
  nodes: MissionGraphNode[];
  edges: MissionGraphEdge[];
};

export type EvidenceItem = {
  id: string;
  origin: EvidenceOrigin;
  label: string;
  detail: string;
  verified: boolean;
  observationDate: string | null;
  verificationState: string | null;
  limitations: string[];
  stale: boolean;
};

export type EvidenceBundle = {
  verified: EvidenceItem[];
  participantSupplied: EvidenceItem[];
  systemSupplied: EvidenceItem[];
  inferred: EvidenceItem[];
  conflicting: Array<{ items: EvidenceItem[]; note: string }>;
  stale: EvidenceItem[];
  missing: string[];
};

export type ContinuityAlert = {
  id: string;
  severity: "information" | "attention" | "critical";
  code: string;
  explanation: string;
  affectedNodeIds: string[];
  recoveryOptions: string[];
  humanReviewRequired: boolean;
};

export type MissionRecommendation = {
  id: string;
  what: string;
  why: string;
  evidence: string[];
  uncertainty: string[];
  whoDecides: "participant" | "human" | "coordinator";
  nextStep: string;
  domain: MapAbleModule;
};

export type MissionActionProposal = {
  id: string;
  action: MissionActionType;
  payload: Record<string, unknown>;
  informationToShare: string[];
  purpose: string;
  estimatedCost: string | null;
  unknownCosts: boolean;
  cancellationTerms: string | null;
  requiredConsent: string[];
  requiredApprovals: Array<"participant" | "human" | "coordinator">;
  payloadHash: string;
  expiryIso: string;
  status: "proposed";
};

export type MapAbleMissionRuntimeContext = MapAbleMissionContext & {
  approvedObjective: string;
  source: MissionSource;
  lifeIntentId: string | null;
  requestedUseOfAccessibilityProfile: boolean;
  plainLanguage: boolean;
  activeCapabilities: string[];
  missingEvidence: string[];
  conflictingEvidence: string[];
  routing: MissionRoutingResult;
  profileUsed: boolean;
};

export type MapAbleMissionPlan = {
  missionId: string;
  objective: string;
  status: MissionPlanStatus;
  summary: string;
  activeAgents: MapAbleAgentActivationEntry[];
  domains: MapAbleModule[];
  missionGraph: MissionGraph;
  evidenceSummary: EvidenceBundle;
  uncertainties: string[];
  continuityAlerts: ContinuityAlert[];
  recommendations: MissionRecommendation[];
  actionProposals: MissionActionProposal[];
  humanReviewItems: MapAbleHumanReviewItem[];
  approvalRequirements: string[];
  nonAiPath: {
    label: string;
    href: string;
    description: string;
  };
  authorityCeiling: AuthorityCeiling;
  approvalBindings: ProposalApprovalBinding[];
  activeAgentIds: MapAbleAgentId[];
  traceId: string;
  createdAt: string;
  updatedAt: string;
};

export type MissionTelemetryKind =
  | "mission_started"
  | "mission_routed"
  | "agent_activated"
  | "capability_used"
  | "evidence_loaded"
  | "evidence_missing"
  | "continuity_alert_created"
  | "recommendation_created"
  | "participant_rejected_recommendation"
  | "approval_requested"
  | "human_review_requested"
  | "mission_replanned"
  | "non_ai_path_selected";
