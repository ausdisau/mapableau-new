/**
 * Shared mission dependency vocabulary.
 * Read-oriented — does not author Care, Transport, or Billing aggregates.
 */

export const MISSION_DEPENDENCY_DOMAINS = [
  "participant_goal",
  "communication_passport",
  "worker_readiness",
  "care",
  "transport_quote",
  "transport_trip",
  "venue_access",
  "indoor_route",
  "equipment",
  "visit_pack",
  "billing_evidence",
  "return_journey",
  "outcome",
  "continuity",
  "other",
] as const;

export type MissionDependencyDomain =
  (typeof MISSION_DEPENDENCY_DOMAINS)[number];

export const MISSION_DEPENDENCY_STATES = [
  "not_started",
  "requested",
  "quoted",
  "accepted",
  "assigned",
  "confirmed",
  "delivered",
  "reviewed",
  "invoiced",
  "outcome_achieved",
  "disputed",
  "recovery_required",
  "blocked",
  "unknown",
  "stale",
] as const;

export type MissionDependencyState =
  (typeof MISSION_DEPENDENCY_STATES)[number];

export type MissionDependencyRelation =
  | "requires"
  | "enables"
  | "evidences"
  | "recovers";

export type MissionDependencyNodeProjection = {
  id: string;
  domain: MissionDependencyDomain;
  label: string;
  state: MissionDependencyState;
  /** Reference to a canonical domain record — never a copied aggregate. */
  sourceRecordRef?: string;
  hardRequirement: boolean;
  freshness: "current" | "stale" | "unknown";
};

export type MissionDependencyEdgeProjection = {
  from: string;
  to: string;
  relation: MissionDependencyRelation;
};

export type MissionDependencyProjection = {
  projectionKey: string;
  vertical: string;
  templateKey?: string;
  participantGoal: string;
  nodes: MissionDependencyNodeProjection[];
  edges: MissionDependencyEdgeProjection[];
  /** Explicit honesty: this projection is not a write SoT. */
  writersInvoked: [];
  productionClaim: "none";
};
