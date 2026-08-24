export type {
  DeterministicOnlyTask,
  PortfolioRouteKind,
  NativeRouteRequest,
  NativeRouteRejectionReason,
  NativeRouteDecision,
  LocalInferenceRequest,
  LocalInferenceResult,
  RetrievalProvenanceRecord,
  GovernedRetrievalHit,
  TrainingProposalStatus,
  DatasetCard,
  ModelCard,
  TrainingProposal,
  LabsNativeIntelligenceView,
} from "./types";
export { DETERMINISTIC_ONLY_TASKS } from "./types";

export {
  summarisePortfolio,
  candidatesForTask,
  resolveFallbackChain,
  taskRequiresDeterministicPolicy,
} from "./portfolio";
export type { PortfolioSummary } from "./portfolio";

export {
  routeNativeIntelligenceTask,
  assertNativeModelCannotExecuteAction,
  assertMustUseCanonicalGateway,
} from "./router";

export { runLocalInference } from "./local-adapter";

export {
  ALLOWED_RETRIEVAL_SOURCE_TYPES,
  listApprovedKnowledgeSeeds,
  retrieveGovernedKnowledge,
  assertProvenancePresent,
} from "./retrieval-policy";
export type { ApprovedKnowledgeSeed } from "./retrieval-policy";

export {
  createTrainingProposal,
  trainingProposalTemplate,
} from "./training-proposal";
export type { CreateTrainingProposalInput } from "./training-proposal";

export {
  buildLabsNativeIntelligenceView,
  labsPortfolioBlurb,
} from "./labs";

/** Eval dimensions to reuse from Prompt 10 for candidate promotion gates. */
export const NATIVE_INTELLIGENCE_EVAL_REQUIREMENTS = [
  "accessibility_language",
  "disability_bias",
  "instruction_following",
  "hallucination",
  "provenance",
  "structured_output",
  "privacy",
  "latency",
  "cost",
  "mission_quality_impact",
] as const;

export type NativeIntelligenceEvalRequirement =
  (typeof NATIVE_INTELLIGENCE_EVAL_REQUIREMENTS)[number];

/**
 * Candidates cannot promote on benchmark alone.
 * Requires governance + eval lab pass across the requirement set.
 */
export function canAutoPromoteModel(): false {
  return false;
}
