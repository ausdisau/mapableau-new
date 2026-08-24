import type { MapAbleMissionPlan } from "@/lib/ai/platform/missions/types";

export const MISSION_EVENT_TYPES = [
  "PARTICIPANT_CHANGED_GOAL","TRANSPORT_UNAVAILABLE","WORKER_CANCELLED","VENUE_ACCESS_CHANGED",
  "PRICE_CHANGED","CONSENT_REVOKED","ACTION_FAILED","APPROVAL_EXPIRED","DEADLINE_APPROACHING",
  "EVIDENCE_STALE","PROVIDER_CANCELLED","SAFEGUARDING_SIGNAL","PARTICIPANT_REJECTED_OPTION",
  "MISSION_CREATED","MISSION_REPLANNED",
] as const;
export type MissionEventType = (typeof MISSION_EVENT_TYPES)[number];

export const EVENT_SOURCES = [
  "participant_reported","authenticated_internal","verified_external","model_inference","system_derived",
] as const;
export type EventSource = (typeof EVENT_SOURCES)[number];
export const TRUSTED_EXTERNAL_SOURCES: EventSource[] = ["verified_external","authenticated_internal"];

export type MapAbleMissionEvent = {
  eventId: string; missionId: string; type: MissionEventType; source: EventSource;
  provenance: {
    reportedBy: string | null; systemRecordId: string | null;
    verificationState: "verified"|"supported"|"partial"|"uncertain"|"unknown";
    limitations: string[];
  };
  occurredAt: string; ingestedAt: string; affectedNodeIds: string[];
  payload: Record<string, unknown>; idempotencyKey: string | null;
};

export const TRIGGER_REASON_CODES = [
  "DEPENDENCY_FAILED","DEPENDENCY_AT_RISK","PARTICIPANT_GOAL_CHANGED","TRANSPORT_DISRUPTION",
  "WORKER_UNAVAILABLE","ACCESS_EVIDENCE_CHANGED","PRICE_MATERIAL_CHANGE","CONSENT_WITHDRAWN",
  "ACTION_EXECUTION_FAILED","APPROVAL_EXPIRED","DEADLINE_IMPOSSIBLE","SAFEGUARDING_ESCALATION",
  "EVIDENCE_STALE","NO_REASSESSMENT_NEEDED",
] as const;
export type TriggerReasonCode = (typeof TRIGGER_REASON_CODES)[number];

export type ReassessmentTrigger = {
  shouldReassess: boolean; reasonCodes: TriggerReasonCode[];
  priority: "low"|"normal"|"high"|"critical"; eventIds: string[]; explanation: string;
};

export const DEPENDENCY_STATES = [
  "healthy","at_risk","failed","unknown","missing","not_authorised","consent_required",
  "human_review","disabled","recovery_available","blocked",
] as const;
export type DependencyState = (typeof DEPENDENCY_STATES)[number];

export type DependencyImpact = {
  nodeId: string; label: string; previousState: DependencyState; currentState: DependencyState;
  preserved: boolean; reason: string;
};

export const MATERIALITY_GATES = [
  "NON_MATERIAL","INFORMATIONAL_CHANGE","PLAN_RECOMPUTE_ALLOWED","PARTICIPANT_DECISION_REQUIRED",
  "REAPPROVAL_REQUIRED","HUMAN_REVIEW_REQUIRED","BLOCKED",
] as const;
export type MaterialityGate = (typeof MATERIALITY_GATES)[number];

export const APPROVAL_PRESERVATION = [
  "UNCHANGED_VALID","EXPIRED","SUPERSEDED","INVALIDATED_BY_GOAL_CHANGE","INVALIDATED_BY_CONSENT_REVOKE",
  "INVALIDATED_BY_PRICE_CHANGE","INVALIDATED_BY_DEPENDENCY_FAILURE","INVALIDATED_BY_SAFEGUARDING","NOT_APPLICABLE",
] as const;
export type ApprovalPreservation = (typeof APPROVAL_PRESERVATION)[number];

export type ApprovalImpact = {
  proposalHash: string; proposedAction: string; preservation: ApprovalPreservation; explanation: string;
};

export type RecoveryConfidence = "verified"|"supported"|"partial"|"uncertain"|"unknown";

export type MapAbleRecoveryAlternative = {
  alternativeId: string; label: string; summary: string; affectedNodeIds: string[];
  preservedNodeIds: string[]; materialityGate: MaterialityGate; confidence: RecoveryConfidence;
  requiresParticipantDecision: boolean; requiresReapproval: boolean; requiresHumanReview: boolean;
  candidatePlanVersion: number; actionProposalIds: string[]; kernelProposalIds: string[]; limitations: string[];
};

export type MissionPlanVersion = {
  missionId: string; planVersion: number; basedOnVersion: number | null; changeReason: string;
  plan: MapAbleMissionPlan; createdAt: string;
};

export type WhatChangedItem = {
  id: string; category: "goal"|"dependency"|"evidence"|"approval"|"timing"|"status";
  summary: string; detail: string; affectedNodeIds: string[]; sinceVersion: number;
};

export type MapAbleRecoveryState = {
  missionId: string; currentPlanVersion: number; activePlanVersion: number;
  candidatePlanVersion: number | null;
  status: "stable"|"reassessing"|"awaiting_participant"|"awaiting_reapproval"|"human_review"|"blocked";
  trigger: ReassessmentTrigger | null; impacts: DependencyImpact[]; materialityGate: MaterialityGate;
  approvalImpacts: ApprovalImpact[]; alternatives: MapAbleRecoveryAlternative[];
  whatChanged: WhatChangedItem[]; previousPlanVersions: number[]; pendingEvents: MapAbleMissionEvent[];
  lastReassessedAt: string | null; killSwitchActive: boolean;
};

export type RecoveryActivityEntry = {
  id: string; timestamp: string;
  kind: "event_ingested"|"reassessment_triggered"|"impact_analysed"|"alternatives_generated"|
    "alternative_selected"|"participant_decision_required"|"kernel_proposal_prepared"|"kill_switch_engaged";
  summary: string; eventId: string | null;
};
