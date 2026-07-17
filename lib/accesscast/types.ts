import type { AccessEvidenceClass } from "@/lib/access-intelligence-next";

import type { AccessCastState } from "./states";

export type AccessCastForecastHorizon =
  | "nowcast"
  | "near_term"
  | "day_outlook"
  | "planning_outlook"
  | "long_range";

export type AccessCastRequirementStatus = "matched" | "failed" | "unresolved";

export type AccessCastRequirement = {
  ontologyConceptId: string;
  kind: "require" | "prefer" | "avoid";
  status: AccessCastRequirementStatus;
  hard: boolean;
  detail: string;
};

export type AccessCastEvidenceRef = {
  evidenceId: string;
  class: AccessEvidenceClass;
  ontologyConceptId?: string;
  source: string;
  observedAt: string;
  summary: string;
  limitations: string[];
  freshUntil?: string | null;
};

export type AccessCastCondition = {
  id: string;
  label: string;
  kind:
    | "incident"
    | "scheduled_change"
    | "service_dependency"
    | "construction"
    | "venue_status"
    | "transport"
    | "environmental"
    | "other";
  effectiveFrom: string;
  effectiveTo: string | null;
  affectsNodeIds: string[];
  hardRequirementImpact: boolean;
  summary: string;
};

export type AccessCastConfirmationTask = {
  id: string;
  label: string;
  status: "suggested" | "confirmation_requested" | "confirmation_received" | "evidence_verified";
  responsibleOrganisation: string;
  dueAt: string | null;
  segmentId: string | null;
};

export type AccessCastFallback = {
  id: string;
  label: string;
  verified: boolean;
  summary: string;
  limitations: string[];
};

export type AccessCastSegmentOutlook = {
  id: string;
  kind: string;
  label: string;
  currentState: AccessCastState;
  futureState: AccessCastState | null;
  evidenceSummary: string;
  evidenceClass: AccessEvidenceClass;
  freshness: "fresh" | "aging" | "stale" | "unknown";
  reliability: string | null;
  hardRequirementEffect: "none" | "supports" | "blocks" | "unresolved";
  fallback: AccessCastFallback | null;
  confirmationTask: AccessCastConfirmationTask | null;
  responsibleOrganisation: string;
  nodeIds: string[];
};

export type AccessCastTimelineItem = {
  id: string;
  at: string;
  label: string;
  kind:
    | "confirmation_due"
    | "scheduled_change"
    | "recovery_buffer"
    | "journey_start"
    | "expected_arrival"
    | "appointment"
    | "return_confirmation"
    | "other";
  relatedSegmentId: string | null;
};

export type AccessCastAdvisory = {
  id: string;
  title: string;
  body: string;
  state: AccessCastState;
  placeRef: string | null;
  nodeIds: string[];
  evidenceIds: string[];
  effectiveFrom: string;
  expiresAt: string | null;
};

export type AccessCastMapListItem = {
  id: string;
  label: string;
  mapState:
    | "known_available"
    | "known_disrupted"
    | "scheduled_change"
    | "stale"
    | "conflicting"
    | "unknown";
  summary: string;
  nodeId: string | null;
};

export type AccessCastEvidenceEnvelope = {
  forecastId: string;
  journeyOrPlaceRef: string;
  requirementSetRef: string;
  forecastGenerationTime: string;
  intendedJourneyTime: string;
  horizon: AccessCastForecastHorizon;
  conclusionState: AccessCastState;
  matchedRequirements: AccessCastRequirement[];
  failedRequirements: AccessCastRequirement[];
  unresolvedRequirements: AccessCastRequirement[];
  conditions: AccessCastCondition[];
  sourceEvidence: AccessCastEvidenceRef[];
  evidenceClasses: AccessEvidenceClass[];
  freshness: {
    oldestEvidenceAt: string | null;
    newestEvidenceAt: string | null;
    staleConceptIds: string[];
  };
  reliability: string | null;
  conflicts: string[];
  assumptions: string[];
  fallback: AccessCastFallback | null;
  confirmationTasks: AccessCastConfirmationTask[];
  confidenceHorizon: string;
  expiry: string;
  auditCorrelationId: string;
  limitations: string[];
  operatingMode: string;
  synthetic: boolean;
  productionClaim: "none";
};

export type AccessCastResult = {
  envelope: AccessCastEvidenceEnvelope;
  plainLanguageSummary: string;
  why: string[];
  suggestedChecks: string[];
  segments: AccessCastSegmentOutlook[];
  timeline: AccessCastTimelineItem[];
  advisories: AccessCastAdvisory[];
  /** Authoritative list alternative to any optional map visualisation. */
  listAlternative: AccessCastMapListItem[];
  recoveryBuffer: {
    recommendedMinutes: number;
    summary: string;
  } | null;
  fragilityWindows: Array<{
    id: string;
    from: string;
    to: string;
    reason: string;
    segmentId: string | null;
  }>;
};

export type AccessCastRequest = {
  placeId?: string;
  journeyRef?: string;
  requirementSetRef?: string;
  intendedJourneyTime: string;
  /** ISO now override for deterministic tests. */
  asOf?: string;
  scenario?: AccessCastSyntheticScenarioId;
};

export type AccessCastSyntheticScenarioId =
  | "harbour_place_baseline"
  | "starting_work_tomorrow"
  | "community_event"
  | "lift_outage"
  | "conflicting_venue"
  | "offline_expired"
  | "vision_false_positive"
  | "return_journey_fragile";
