import type {
  CostClass,
  LatencyClass,
  ModelEvaluationStatus,
  NativeIntelligenceTaskKind,
} from "@/lib/ai/platform/models/registry";
import type { AuthorityCeiling } from "@/lib/ai/platform/types/authority";
import type { DataClass } from "@/lib/ai/platform/types/classification";

/**
 * Types for the MapAble-owned model layer (R&D).
 * Prefer "MapAble-native intelligence" / "MapAble-owned model layer".
 */

export const DETERMINISTIC_ONLY_TASKS = [
  "permission_decision",
  "action_execution",
  "mission_policy",
  "safeguarding_adjudication",
  "funding_alteration",
] as const;

export type DeterministicOnlyTask = (typeof DETERMINISTIC_ONLY_TASKS)[number];

export type PortfolioRouteKind =
  | "cloud_gateway"
  | "local_oss"
  | "deterministic"
  | "human_assistance"
  | "rejected";

export type NativeRouteRequest = {
  /** Canonical capability key — must still pass through the model gateway. */
  capabilityKey: string;
  taskKind: NativeIntelligenceTaskKind;
  dataClasses: DataClass[];
  consentGranted: boolean;
  cloudAvailable: boolean;
  /** Requested latency preference — not a hard "best model" pick. */
  preferredLatencyClass?: LatencyClass;
  preferredCostClass?: CostClass;
  /** Candidate model the caller hopes to use (optional). */
  requestedModelId?: string;
  /** When true, treat as production capability (blocks unevaluated silent switch). */
  productionCapability?: boolean;
  /** Attempted authority ceiling from the model path — models cannot raise this. */
  requestedAuthorityCeiling?: AuthorityCeiling;
};

export type NativeRouteRejectionReason =
  | "rnd_disabled"
  | "unapproved_model"
  | "prohibited_data_class"
  | "local_routing_disabled"
  | "evaluation_incomplete"
  | "production_unevaluated_switch"
  | "authority_bypass_attempt"
  | "model_outage"
  | "consent_required"
  | "deterministic_required"
  | "action_execution_forbidden"
  | "capability_gateway_required";

export type NativeRouteDecision =
  | {
      ok: true;
      routeKind: Exclude<PortfolioRouteKind, "rejected">;
      modelId: string;
      evaluationStatus: ModelEvaluationStatus;
      usedFallback: boolean;
      fallbackFromModelId?: string;
      /** Always false — native layer never grants action execution. */
      mayExecuteAction: false;
      /** Always false — models cannot raise authority. */
      authorityRaised: false;
      notes: string[];
    }
  | {
      ok: false;
      routeKind: "rejected" | "deterministic";
      reason: NativeRouteRejectionReason;
      useDeterministicFallback: boolean;
      mayExecuteAction: false;
      authorityRaised: false;
      notes: string[];
    };

export type LocalInferenceRequest = {
  modelId: string;
  taskKind: NativeIntelligenceTaskKind;
  inputText: string;
  maxOutputTokens?: number;
};

export type LocalInferenceResult =
  | {
      ok: true;
      modelId: string;
      outputText: string;
      structured?: Record<string, unknown>;
      experimental: true;
      labsOnly: true;
      productionSupported: false;
    }
  | {
      ok: false;
      reason: string;
      useDeterministicFallback: true;
    };

export type RetrievalProvenanceRecord = {
  sourceId: string;
  sourceType:
    | "policy"
    | "accessibility_evidence"
    | "public_disability_guidance"
    | "service_info"
    | "approved_domain_doc";
  title: string;
  version: string;
  retrievedAt: string;
  licenseOrBasis: string;
  /** Unverified business-plan claims must not be taught as operational truth. */
  operationalTruth: boolean;
};

export type GovernedRetrievalHit = {
  chunkId: string;
  text: string;
  score: number;
  provenance: RetrievalProvenanceRecord;
};

export type TrainingProposalStatus =
  | "draft"
  | "awaiting_governance"
  | "rejected"
  | "approved_for_eval_only"
  | "withdrawn";

export type DatasetCard = {
  name: string;
  purpose: string;
  provenance: string;
  consentOrLicense: string;
  deIdentification: string;
  representativenessNotes: string;
  biasRisks: string[];
  deletionWithdrawalProcess: string;
  evalSplitDescription: string;
  prohibitedSources: string[];
};

export type ModelCard = {
  name: string;
  baseModel: string;
  intendedTasks: NativeIntelligenceTaskKind[];
  outOfScope: string[];
  evaluationStatus: ModelEvaluationStatus;
};

export type TrainingProposal = {
  id: string;
  status: TrainingProposalStatus;
  governanceOwner: string;
  createdAt: string;
  /** Evidence that retrieval + prompting + rules are insufficient. */
  insufficiencyEvidence: string;
  datasetCard: DatasetCard;
  modelCard: ModelCard;
  evalPlan: string;
  privacyImpactSummary: string;
  computeEstimate: string;
  rollbackPlan: string;
  licensingNotes: string;
  /** Stop condition: significant infra spend needs owner decision. */
  requiresOwnerInfraDecision: boolean;
};

export type LabsNativeIntelligenceView = {
  experimental: true;
  label: "MapAble-native intelligence (experimental)";
  modelUsed: string | null;
  limitations: string[];
  dataHandling: string[];
  productionSupported: false;
  participantFacingClaimAllowed: false;
};
