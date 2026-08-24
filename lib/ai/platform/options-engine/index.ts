export type {
  OptionsDomain, HardConstraintKind, HardConstraint, RankingDimension, RankingPriorities, EvidenceState,
  VerificationState, EvidenceItem, OptionCandidate, ConstraintFailure, EligibilityResult, DimensionScores,
  OptionExplanation, RankedOption, OptionsRequest, OptionsSession, ChooseOptionInput, ChooseOptionResult, ProhibitedHeuristic,
} from "./types";
export {
  OPTIONS_DOMAINS, HARD_CONSTRAINT_KINDS, RANKING_DIMENSIONS, DEFAULT_RANKING_PRIORITIES,
  EVIDENCE_STATES, VERIFICATION_STATES, PROHIBITED_HEURISTICS,
} from "./types";
export { optionsRequestSchema, chooseOptionInputSchema, reRankInputSchema, hardConstraintSchema, optionCandidateSchema, rankingPrioritiesSchema } from "./schemas";
export { applyHardConstraints, mapLegacyConstraintKind } from "./constraints";
export { evaluateEvidenceEligibility, findEligibility } from "./eligibility";
export { normalizeRankingPriorities, rankCandidates, scoreDimensions, weightedScore, describePriorities } from "./ranking";
export { explainOption } from "./explain";
export { assertFairRanking, sanitizeCandidatesForFairness, isProhibitedHeuristic } from "./fairness";
export {
  CONSOLIDATED_MATCHING_SOURCES, OPTIONS_ENGINE_ALGORITHM_REFS, OPTIONS_ENGINE_CAPABILITY_KEY,
  OPTIONS_MODEL_EXPLANATION_CAPABILITY_KEY, domainLimitations, algorithmRegisterRefForDomain,
} from "./registry";
export { generateOptions, generateOptionsRulesOnly, reRankOptions, chooseOption, getOptionsSnapshot, OptionsEngineError } from "./engine";
export { saveOptionsSession, getOptionsSession, clearOptionsStore, listOptionsSessionsForParticipant } from "./store";
export { formatOptionsForParticipant, type OptionsPresentation } from "./presentation";
export { optionsForRecoveryAlternative, inferDomainFromRecoveryLabel } from "./recovery-bridge";
export { careDomainNotes, enrichCareCandidate, toCareOptionCandidate } from "./domains/care";
export { transportDomainNotes, enrichTransportCandidate, transportWheelchairRequirement, toTransportOptionCandidate } from "./domains/transport";
export { jobsDomainNotes, enrichJobsCandidate, jobsDisclosureBoundaryConstraint, toJobsOptionCandidate, scrubEmployerFacingPayload } from "./domains/jobs";
export { accessDomainNotes, enrichAccessCandidate, toAccessOptionCandidate } from "./domains/access";
