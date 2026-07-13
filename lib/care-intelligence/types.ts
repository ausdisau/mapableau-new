export type CoordinationDecision =
  | "monitor"
  | "propose"
  | "clarify"
  | "escalate"
  | "refuse"
  | "blocked";

export type RequestKind =
  | "coordinate_support"
  | "clinical_decision"
  | "funding_decision"
  | "restrictive_practice"
  | "emergency_action";

export type Disruption =
  | "none"
  | "worker_cancelled"
  | "vehicle_cancelled"
  | "linked_cancellation"
  | "vehicle_delay";

export type MandateAction =
  | "prepare_worker_replacement"
  | "prepare_transport_replacement"
  | "prepare_linked_recovery"
  | "prepare_delay_notice";

export type SpecialistAgentId =
  | "rights"
  | "continuity"
  | "accessibility"
  | "journey"
  | "budget";

export interface ParticipantGoal {
  id: string;
  statement: string;
  priority: "essential" | "important" | "preferred";
}

export interface ParticipantMandate {
  id: string;
  status: "active" | "revoked" | "expired";
  startsAt: string;
  endsAt: string;
  autonomyLevel: 0 | 1 | 2 | 3;
  allowedActions: MandateAction[];
  allowedWorkerIds: string[];
  allowedVehicleIds: string[];
  maxTimeShiftMinutes: number;
  maxPriceDeltaCents: number;
  requireParticipantConfirmation: true;
}

export interface ParticipantWorldState {
  participantAlias: string;
  goals: ParticipantGoal[];
  preferredLanguage: string;
  communicationMethod: string;
  preferFamiliarWorkers: boolean;
  requiredSupportTags: string[];
  requiredAccessFeatures: string[];
  consentScopes: string[];
  mandate: ParticipantMandate;
  episodicMemory: Array<{
    id: string;
    occurredAt: string;
    kind: "participant_choice" | "journey_outcome" | "correction";
    summary: string;
    source: "synthetic_participant" | "synthetic_outcome";
  }>;
}

/** Situational context only. It must never become a score assigned to a person. */
export interface SafeguardContext {
  serviceCriticality: "ordinary" | "high";
  missedSupportConsequence: "low" | "moderate" | "high";
  humanCoordinatorAvailable: boolean;
}

export interface SupportJourney {
  id: string;
  goal: string;
  appointmentStart: string | null;
  pickupSuburb: string | null;
  destination: string | null;
  disruption: Disruption;
  delayMinutes: number;
}

export interface WorkerCandidate {
  id: string;
  displayName: string;
  familiarToParticipant: boolean;
  availability: "available" | "unavailable";
  screening: "valid" | "expired";
  supportTags: string[];
  languages: string[];
  timeShiftMinutes: number;
  priceDeltaCents: number;
  untrustedText?: string;
}

export interface VehicleCandidate {
  id: string;
  displayName: string;
  availability: "available" | "unavailable";
  verification: "verified" | "unverified";
  accessFeatures: string[];
  timeShiftMinutes: number;
  priceDeltaCents: number;
  untrustedText?: string;
}

export interface CoordinationScenario {
  id: string;
  title: string;
  description: string;
  researchQuestion: string;
  synthetic: true;
  expectedDecision: CoordinationDecision;
  requestKind: RequestKind;
  participantStop: boolean;
  world: ParticipantWorldState;
  safeguardContext: SafeguardContext;
  journey: SupportJourney;
  workerCandidates: WorkerCandidate[];
  vehicleCandidates: VehicleCandidate[];
}

export interface EvidenceReference {
  id: string;
  sourceType: "scenario" | "mandate" | "preference" | "candidate" | "memory";
  sourceId: string;
  summary: string;
}

export interface SpecialistObservation {
  agent: SpecialistAgentId;
  status: "support" | "concern" | "blocked" | "not_reached";
  summary: string;
  confidence: number;
  evidenceIds: string[];
  candidateIds: string[];
}

export interface CounterfactualOutcome {
  planId: string;
  workerId: string | null;
  vehicleId: string | null;
  timeShiftMinutes: number;
  priceDeltaCents: number;
  appointmentLikelyMet: boolean;
  accessRequirementsMet: boolean;
  continuityPreserved: boolean;
  mandateLimitsMet: boolean;
  utility: number;
  uncertainty: number;
  reasons: string[];
}

export interface RecoveryPlan {
  id: string;
  rank: number;
  worker: { id: string; displayName: string } | null;
  vehicle: { id: string; displayName: string } | null;
  counterfactual: CounterfactualOutcome;
  supportedByAgents: SpecialistAgentId[];
  concerns: string[];
}

export interface PolicyDecision {
  decision: CoordinationDecision;
  autonomyLevel: 0 | 1 | 2 | 3;
  ruleIds: string[];
  reasons: string[];
  requiredNextSteps: string[];
}

export interface ActionIntent {
  id: string;
  action: MandateAction;
  planId: string;
  state: "awaiting_participant_confirmation";
  executionAllowed: false;
  participantConfirmationRequired: true;
  externalTool: null;
  expiresAt: string;
}

export interface DeliberationNode {
  id: string;
  stage:
    | "boundary"
    | "authority"
    | "observe"
    | "specialists"
    | "simulate"
    | "policy"
    | "participant_control";
  status: "passed" | "blocked" | "needs_input" | "not_reached";
  label: string;
  summary: string;
  evidenceIds: string[];
}

export interface CoordinationRun {
  runId: string;
  scenarioId: string;
  generatedAt: string;
  decision: CoordinationDecision;
  participantMessage: string;
  worldStateSummary: {
    activeGoals: number;
    explicitPreferences: number;
    memoryEventsRead: number;
    memoryEventsWritten: 0;
  };
  evidence: EvidenceReference[];
  specialistObservations: SpecialistObservation[];
  plans: RecoveryPlan[];
  policy: PolicyDecision;
  actionIntents: ActionIntent[];
  deliberationGraph: DeliberationNode[];
  agentDisagreement: {
    present: boolean;
    summary: string;
  };
  filteredCandidateIds: string[];
  boundaries: {
    syntheticDataOnly: true;
    realWorldActions: 0;
    externalMessages: 0;
    externalModelCalls: 0;
    persistentMemoryWrites: 0;
    participantCanStop: true;
    mandateRevocable: true;
    participantConfirmationRequired: true;
    selfModificationAllowed: false;
  };
}

export interface EvaluationScenarioResult {
  scenarioId: string;
  expectedDecision: CoordinationDecision;
  actualDecision: CoordinationDecision;
  passed: boolean;
  checks: Array<{ id: string; passed: boolean; detail: string }>;
}

export interface EvaluationReport {
  generatedAt: string;
  totalScenarios: number;
  passedScenarios: number;
  hardBoundaryViolations: number;
  evidenceIntegrityFailures: number;
  passed: boolean;
  results: EvaluationScenarioResult[];
}
