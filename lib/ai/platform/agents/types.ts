import type { MapAbleModule } from "@/intelligence/types";
import type { ProposalApprovalBinding } from "@/lib/ai/platform/human-review/contracts";
import type {
  AuthorityCeiling,
  ProhibitedAutonomousAction,
} from "@/lib/ai/platform/types/authority";

/** Exactly eight canonical operational agent IDs. */
export const MAPABLE_OPERATIONAL_AGENT_IDS = [
  "mission_orchestrator",
  "participant_authority",
  "evidence_intelligence",
  "access_mobility",
  "support_participation",
  "work_participation",
  "continuity_assurance",
  "finance_administration",
] as const;

export type MapAbleAgentId = (typeof MAPABLE_OPERATIONAL_AGENT_IDS)[number];

export type MapAbleAgentActivationStatus =
  | "active"
  | "available"
  | "unavailable"
  | "degraded"
  | "disabled";

export type MapAbleAgentActivationMode =
  | "always_for_participant_missions"
  | "domain_gated"
  | "request_gated";

export type MapAbleAgentManifest = {
  id: MapAbleAgentId;
  version: string;
  name: string;
  description: string;
  role: string;
  domains: MapAbleModule[];
  /** Must resolve against lib/ai/platform/capabilities/registry.ts */
  capabilityKeys: string[];
  authorityCeiling: AuthorityCeiling;
  activation: MapAbleAgentActivationMode;
  handoffs: MapAbleAgentId[];
  requiredConsentScopes: string[];
  requiredHumanReviewFor: string[];
  prohibitedActions: ProhibitedAutonomousAction[];
  fallbackAgentId: MapAbleAgentId | "human" | "non_ai_path";
  evaluationSuite: string;
  owner: string;
  /** ISO date of last human review of the manifest (static). */
  lastReview: string;
};

export type MapAbleAgentActor = {
  actorId: string;
  actorType: "participant" | "authorised_human" | "system" | "admin";
};

export type MapAbleHumanReviewItem = {
  id: string;
  category: string;
  reason: string;
  urgency: "routine" | "urgent";
  evidenceRefs: string[];
  continuationMessage: string;
  /** Never used to decide reportability or substantiation. */
  aiMayDecideReportability: false;
  aiMaySubstantiateAllegation: false;
};

export type MapAbleMissionContext = {
  missionId: string;
  actor: MapAbleAgentActor;
  participantId: string | null;
  objective: string;
  domains: MapAbleModule[];
  consentScopes: string[];
  communicationPreferences: string[];
  evidenceRefs: string[];
  activeAgentIds: MapAbleAgentId[];
  authorityCeiling: AuthorityCeiling;
  approvalBindings: ProposalApprovalBinding[];
  featureFlags: Record<string, boolean>;
  humanReviewItems: MapAbleHumanReviewItem[];
  traceId: string;
};

export type MapAbleAgentHandoff = {
  missionId: string;
  approvedObjective: string;
  fromAgent: MapAbleAgentId;
  toAgent: MapAbleAgentId;
  minimumContext: Record<string, string | number | boolean | null>;
  evidenceRefs: string[];
  consentScopes: string[];
  unresolvedQuestions: string[];
  authorityCeiling: AuthorityCeiling;
  traceId: string;
};

export type MapAbleAgentActivationEntry = {
  id: MapAbleAgentId;
  name: string;
  role: string;
  status: MapAbleAgentActivationStatus;
  authorityCeiling: AuthorityCeiling;
  capabilityKeys: string[];
  reason: string;
  fallbackAvailable: boolean;
};

export type SelectMapAbleAgentsInput = {
  objective: string;
  domains: MapAbleModule[];
  actor: MapAbleAgentActor;
  consentScopes?: string[];
  requestedCapabilities?: string[];
  /** When false, continuity_assurance is not activated. Default true. */
  includeContinuityAnalysis?: boolean;
  /** Optional enabled-module map (CareOS / intelligence fabric). */
  enabledModules?: Partial<Record<MapAbleModule, boolean>>;
  /**
   * When true (CareOS compatibility), disabled capability flags degrade
   * rather than make the agent unavailable so module gating remains primary.
   */
  relaxCapabilityFlags?: boolean;
};

export type SelectMapAbleAgentsResult = {
  activeAgents: MapAbleAgentActivationEntry[];
  unavailableAgents: MapAbleAgentActivationEntry[];
  requiredHumanReviews: MapAbleHumanReviewItem[];
  missingConsentScopes: string[];
  disabledCapabilities: string[];
  authorityCeiling: AuthorityCeiling;
};
