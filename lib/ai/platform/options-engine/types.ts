/**
 * Explainable Matching + Options Engine — shared types.
 */
export const OPTIONS_DOMAINS = ["care", "transport", "jobs", "access"] as const;
export type OptionsDomain = (typeof OPTIONS_DOMAINS)[number];
export const HARD_CONSTRAINT_KINDS = [
  "required_accessibility_feature","verified_vehicle_suitability","required_worker_credential",
  "availability_window","location_service_area","participant_exclusion","employer_work_requirement",
  "consent_disclosure_boundary",
] as const;
export type HardConstraintKind = (typeof HARD_CONSTRAINT_KINDS)[number];
export const RANKING_DIMENSIONS = [
  "access_fit","time_fit","availability","participant_preference","distance","continuity","known_cost","evidence_quality",
] as const;
export type RankingDimension = (typeof RANKING_DIMENSIONS)[number];
export const EVIDENCE_STATES = ["missing","unverified","self_reported","community_reported","verified","stale","conflicting"] as const;
export type EvidenceState = (typeof EVIDENCE_STATES)[number];
export const VERIFICATION_STATES = ["unverified","pending","verified","failed","not_applicable"] as const;
export type VerificationState = (typeof VERIFICATION_STATES)[number];
export type RankingPriorities = Record<RankingDimension, number>;
export const DEFAULT_RANKING_PRIORITIES: RankingPriorities = {
  access_fit: 0.2, time_fit: 0.12, availability: 0.12, participant_preference: 0.2,
  distance: 0.1, continuity: 0.1, known_cost: 0.06, evidence_quality: 0.1,
};
export type HardConstraint = { kind: HardConstraintKind; label: string; value: string; required: boolean };
export type EvidenceItem = { id: string; label: string; state: EvidenceState; source?: string; freshnessLabel?: string; notes?: string };
export type OptionCandidate = {
  id: string; domain: OptionsDomain; tenantId: string; displayName: string; providerLabel: string;
  features: string[]; credentials: string[]; serviceAreas: string[]; availabilityWindows: string[];
  exclusions: string[]; evidence: EvidenceItem[]; verificationState: VerificationState;
  distanceKm: number | null; knownCostAud: number | null; continuityScore: number | null; preferenceTags: string[];
  disclosureRequired?: boolean;
  vehicleSuitability?: { wheelchairAccessible: boolean; hoistAvailable: boolean; verified: boolean };
  accessProfile?: { claimedAccessible: boolean; barrierAbsenceOnly: boolean; source?: string; freshnessLabel?: string };
  metadata?: Record<string, unknown>;
};
export type ConstraintFailure = { candidateId: string; kind: HardConstraintKind; reason: string };
export type EligibilityResult = { candidateId: string; eligible: boolean; evidenceGaps: string[]; conflictingEvidence: string[]; notes: string[] };
export type DimensionScores = Record<RankingDimension, number>;
export type OptionExplanation = {
  whyItMatches: string[]; evidence: Array<{ label: string; state: EvidenceState; detail?: string }>;
  unknowns: string[]; imperfectFits: string[]; costIfKnown: string | null; whoProvides: string;
  verificationState: VerificationState; whatHappensNext: string; modelCommentary: string | null;
};
export type RankedOption = {
  optionId: string; candidateId: string; domain: OptionsDomain; displayName: string; providerLabel: string;
  score: number; dimensionScores: DimensionScores; explanation: OptionExplanation;
  isAssignment: false; isConfirmation: false; isEmployerDisclosure: false;
};
export type OptionsRequest = {
  sessionId?: string; tenantId: string; participantId: string; actorId: string; domain: OptionsDomain;
  missionId?: string; traceId?: string; requirements: HardConstraint[]; rankingPriorities?: Partial<RankingPriorities>;
  exclusions?: string[]; functionalRequirementsAuthorised?: boolean; disclosureConsentGranted?: boolean;
  consentScopes?: string[]; candidates: OptionCandidate[]; requestModelExplanation?: boolean;
};
export type OptionsSession = {
  sessionId: string; tenantId: string; participantId: string; actorId: string; domain: OptionsDomain;
  missionId: string | null; traceId: string; createdAt: string; requirements: HardConstraint[];
  rankingPriorities: RankingPriorities; eliminated: ConstraintFailure[]; eligibility: EligibilityResult[];
  options: RankedOption[]; selectedOptionId: string | null; preparedProposalId: string | null;
  limitations: string[]; algorithmRegisterRef: string; modelExplanationUsed: boolean;
};
export type ChooseOptionInput = {
  sessionId: string; optionId: string; participantId: string; tenantId: string;
  prepareActionProposal?: boolean; missionId?: string; consentScopes?: string[];
};
export type ChooseOptionResult = {
  session: OptionsSession; selected: RankedOption; didAssign: false; didConfirmTransport: false;
  didDiscloseToEmployer: false; preparedProposalId: string | null; nextStep: string;
};
export const PROHIBITED_HEURISTICS = [
  "rank_by_profitability","rank_by_ease_of_service","penalise_complex_disability_requirements",
  "infer_compatibility_from_diagnosis","discriminatory_steering","auto_assign_worker",
  "auto_confirm_transport","auto_disclose_disability_to_employer",
] as const;
export type ProhibitedHeuristic = (typeof PROHIBITED_HEURISTICS)[number];
