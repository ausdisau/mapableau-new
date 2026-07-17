/**
 * MapAble Replay Lab — core contracts.
 * Synthetic-only. Never an operational source of truth.
 */

export const REPLAY_EVENT_NAMESPACE = "mapable.replay" as const;

export type ReplayProductMode =
  | "engineering_regression"
  | "provider_exercise"
  | "academy_simulation"
  | "participant_codesign"
  | "partner_conformance"
  | "policy_civic";

export type ReplayAssertionResultState =
  | "passed"
  | "passed_with_limitations"
  | "failed"
  | "blocked"
  | "cannot_determine"
  | "human_review_required";

export type ReplayScorecardDimension =
  | "rights"
  | "communication"
  | "access"
  | "workforce"
  | "continuity"
  | "evidence"
  | "outcome"
  | "burden";

/** Known synthetic event types under mapable.replay.* */
export const REPLAY_EVENT_TYPES = [
  "mapable.replay.participant.goal_selected",
  "mapable.replay.communication.instructions_shared",
  "mapable.replay.communication.instructions_acknowledged",
  "mapable.replay.communication.requirement_violated",
  "mapable.replay.worker.credential_expired",
  "mapable.replay.worker.cancelled",
  "mapable.replay.worker.competency_checked",
  "mapable.replay.transport.vehicle_proposed",
  "mapable.replay.transport.trip_confirmed",
  "mapable.replay.transport.trip_rejected",
  "mapable.replay.transport.replacement_proposed",
  "mapable.replay.equipment.battery_low",
  "mapable.replay.equipment.breakdown",
  "mapable.replay.access.lift_unavailable",
  "mapable.replay.employer.room_changed",
  "mapable.replay.handoff.sent",
  "mapable.replay.handoff.accepted",
  "mapable.replay.handoff.rejected",
  "mapable.replay.continuity.case_opened",
  "mapable.replay.recovery.option_created",
  "mapable.replay.participant.option_approved",
  "mapable.replay.participant.option_refused",
  "mapable.replay.participant.consent_revoked",
  "mapable.replay.billing.invoice_rejected",
  "mapable.replay.outcome.review_requested",
  "mapable.replay.outcome.participant_confirmed",
  "mapable.replay.appeal.created",
  "mapable.replay.clock.deadline_reached",
  "mapable.replay.system.prohibited_action_blocked",
] as const;

export type ReplayEventType = (typeof REPLAY_EVENT_TYPES)[number];

export type ReplayEvidenceClass =
  | "synthetic_fixture"
  | "synthetic_observation"
  | "synthetic_assertion"
  | "unknown";

export type ReplayRedactionClass =
  | "public_synthetic"
  | "internal_synthetic"
  | "restricted_synthetic";

export type ReplayActorRole =
  | "participant"
  | "supporter"
  | "worker"
  | "provider_coordinator"
  | "driver"
  | "transport_operator"
  | "employer"
  | "venue"
  | "equipment_supplier"
  | "navigator"
  | "plan_manager"
  | "council"
  | "api_partner"
  | "aura"
  | "application_service";

export type ReplayActor = {
  id: string;
  displayName: string;
  role: ReplayActorRole;
  organisationId: string | null;
  /** Relationship must not imply authority. */
  authorityScopes: string[];
  communicationCapabilities: string[];
  availableActions: string[];
  prohibitedActions: string[];
  responseDelaySeconds: number;
  failureBehaviour: string;
};

export type ReplayEventEnvelope = {
  simulationId: string;
  scenarioId: string;
  runId: string;
  eventId: string;
  virtualTimestamp: string;
  sourceActor: string;
  sourceSystem: string;
  eventType: ReplayEventType;
  payloadVersion: number;
  causalParent: string | null;
  correlationId: string;
  authorityReference: string | null;
  evidenceClass: ReplayEvidenceClass;
  /** Unmistakable synthetic marker — required. */
  synthetic: true;
  affectedGoal: string | null;
  visibility: "run" | "report" | "public_synthetic";
  redactionClass: ReplayRedactionClass;
  payload: Record<string, unknown>;
};

export type ReplayAssertion = {
  id: string;
  description: string;
  dimension: ReplayScorecardDimension;
};

export type ReplayAssertionResult = {
  assertionId: string;
  state: ReplayAssertionResultState;
  detail: string;
  dimension: ReplayScorecardDimension;
};

export type JourneyIntegrityScorecard = {
  mode: ReplayProductMode;
  dimensions: Record<
    ReplayScorecardDimension,
    {
      state: ReplayAssertionResultState;
      notes: string[];
    }
  >;
  assertionResults: ReplayAssertionResult[];
  /** Explicitly absent — never produce a bare universal score. */
  universalScore: null;
  watermark: string;
};

export type ReplayScenarioMeta = {
  id: string;
  version: number;
  title: string;
  purpose: string;
  mode: ReplayProductMode;
  author: string;
  reviewers: string[];
  lastReview: string | null;
  deprecation: "active" | "deprecated" | "retired";
  ontologyVersion: string;
  canonicalDomainVersions: Record<string, string>;
  policyVersions: Record<string, string>;
};

export type ReplayParticipantRef = {
  fixture: string;
};

export type ReplayGoal = {
  type: string;
  outcome: string;
};

export type ReplayRequirements = {
  communication?: {
    one_question_at_a_time?: boolean;
    response_time_seconds?: number;
    written_and_spoken?: boolean;
    aac_required?: boolean;
  };
  mobility?: {
    step_free?: boolean;
    minimum_clear_width_mm?: number;
    power_chair_transport?: boolean;
  };
  authority?: {
    participant_directed?: boolean;
    supporter_may_not_consent?: boolean;
  };
};

export type ReplayTimelineEntry = {
  at: string;
  event: ReplayEventType | string;
  data?: Record<string, unknown>;
  actor?: string;
};

export type ReplayScenarioDocument = {
  scenario: ReplayScenarioMeta;
  participant: ReplayParticipantRef;
  goal: ReplayGoal;
  requirements: ReplayRequirements;
  world?: {
    precinct: string;
    harbourSnapshotId?: string;
  };
  actors?: ReplayActor[];
  timeline: ReplayTimelineEntry[];
  chaos_cards?: string[];
  expected: string[];
  prohibited?: string[];
  localisation?: {
    locale: string;
    timeZone: string;
  };
};

export type ReplayPersonaFixture = {
  id: string;
  displayName: string;
  role: "participant";
  harbourRequirementSetRef: string;
  limitations: string[];
};

export const TAYLOR_PERSONA: ReplayPersonaFixture = {
  id: "fixture:taylor",
  displayName: "Taylor",
  role: "participant",
  harbourRequirementSetRef: "fixture:taylor-harbour-v1",
  limitations: [
    "Synthetic persona only — not demographic prevalence data",
    "Does not represent all disabled people",
  ],
};

export const HARBOUR_WORLD_REF = {
  snapshotId: "harbour-civic-synthetic-v1",
  precinctId: "harbour_civic",
  canonicalPlaceRef: "accessplace:synthetic:harbour_civic",
  sourcePath: "lib/access-intelligence-next/graph/harbour-fixture.ts",
} as const;
