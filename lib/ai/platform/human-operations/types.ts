/**
 * Human Operations Console — canonical review queue types (Prompt 08).
 * Extends human-review contracts; does not create a parallel review system.
 */

import type { MapAbleHumanReviewItem } from "@/lib/ai/platform/agents/types";
import type { HumanReviewState } from "@/lib/ai/platform/human-review/contracts";

export const HUMAN_OPS_CATEGORIES = [
  "care_coordination",
  "transport_continuity",
  "access_evidence",
  "authority_review",
  "financial_review",
  "credential_exception",
  "employment_disclosure_review",
  "safeguarding",
  "general_coordination",
] as const;

export type HumanOpsCategory = (typeof HUMAN_OPS_CATEGORIES)[number];

export const HUMAN_OPS_PRIORITIES = [
  "routine",
  "attention",
  "urgent",
  "critical",
] as const;

export type HumanOpsPriority = (typeof HUMAN_OPS_PRIORITIES)[number];

export const HUMAN_OPS_STATUSES = [
  "queued",
  "assigned",
  "awaiting_information",
  "in_review",
  "resolved",
  "escalated",
  "withdrawn",
] as const;

export type HumanOpsStatus = (typeof HUMAN_OPS_STATUSES)[number];

export const HUMAN_OPS_RESOLUTIONS = [
  "continue_workflow",
  "request_participant_decision",
  "request_information",
  "prepare_action_proposal",
  "prepare_recovery_alternative",
  "route_to_specialist_human",
  "close_coordination_only",
  "unable_to_assist",
] as const;

export type HumanOpsResolution = (typeof HUMAN_OPS_RESOLUTIONS)[number];

export const SAFEGUARDING_FORBIDDEN_RESOLUTIONS = [
  "substantiate_allegation",
  "dismiss_allegation",
  "decide_reportability",
  "authorise_restrictive_practice",
  "close_incident",
  "impose_sanction",
] as const;

export type SafeguardingForbiddenResolution =
  (typeof SAFEGUARDING_FORBIDDEN_RESOLUTIONS)[number];

export const HUMAN_OPS_SOURCES = [
  "mission_runtime",
  "recovery_engine",
  "action_kernel",
  "matching",
  "safeguarding_gate",
  "continuity",
  "manual_intake",
] as const;

export type HumanOpsSource = (typeof HUMAN_OPS_SOURCES)[number];

export type HumanOpsResolutionRecord = {
  resolution: HumanOpsResolution;
  resolutionReason: string;
  decidedBy: string;
  decidedUnderAuthority: string;
  evidenceRefsUsed: string[];
  participantApprovalBypassed: false;
  delegateAuthorityId: string | null;
  nextStepsPrepared: string[];
  decidedAt: string;
};

export type HumanOpsReviewItem = {
  reviewId: string;
  missionId: string | null;
  participantId: string;
  tenantId: string;
  category: HumanOpsCategory;
  priority: HumanOpsPriority;
  reasonCodes: string[];
  evidenceRefs: string[];
  requestedBy: string;
  requiredRole: string;
  status: HumanOpsStatus;
  assignedTo: string | null;
  createdAt: string;
  updatedAt: string;
  dueAt: string | null;
  resolution: HumanOpsResolutionRecord | null;
  resolutionReason: string | null;
  auditRefs: string[];
  source: HumanOpsSource;
  sourceReviewItemId: string | null;
  internalNotes: string[];
  participantFacingReason: string;
  handlingTeam: string;
  whatHappensNext: string;
  preparedNextStepIds: string[];
  proposalReviewState: HumanReviewState | null;
  aiMayDecideReportability: false;
  aiMaySubstantiateAllegation: false;
  aiMayAuthoriseRestrictivePractice: false;
  aiMayCloseIncidentOrComplaint: false;
};

export type HumanOpsEnqueueInput = {
  participantId: string;
  tenantId: string;
  missionId?: string | null;
  category: HumanOpsCategory;
  priority?: HumanOpsPriority;
  reasonCodes: string[];
  evidenceRefs?: string[];
  requestedBy: string;
  source: HumanOpsSource;
  sourceReviewItemId?: string | null;
  participantFacingReason: string;
  dueAt?: string | null;
  handlingTeam?: string;
};

export type HumanOpsOperatorContext = {
  operatorId: string;
  primaryRole: string;
  permissions: string[];
  tenantIds: string[];
};

export type HumanOpsQueueFilter = {
  status?: HumanOpsStatus | HumanOpsStatus[];
  category?: HumanOpsCategory | HumanOpsCategory[];
  missionId?: string;
  participantId?: string;
  assignedTo?: string | null;
  priority?: HumanOpsPriority | HumanOpsPriority[];
};

export type ParticipantReviewVisibility = {
  reviewId: string;
  whyNeeded: string;
  status: HumanOpsStatus;
  handlingTeam: string;
  informationUsed: string[];
  whatHappensNext: string;
  categoryLabel: string;
  protectedInternalDetailExcluded: true;
};

export type OperatorReviewView = {
  reviewId: string;
  missionId: string | null;
  participantId: string;
  tenantId: string;
  category: HumanOpsCategory;
  priority: HumanOpsPriority;
  status: HumanOpsStatus;
  reasonCodes: string[];
  evidenceRefs: string[];
  assignedTo: string | null;
  createdAt: string;
  dueAt: string | null;
  internalNotes: string[];
  participantFacingReason: string;
  resolution: HumanOpsResolutionRecord | null;
  auditRefs: string[];
  preparedNextStepIds: string[];
  authorityReminder: string;
  safeguardingBoundaryActive: boolean;
};

export type IngestHumanReviewItemInput = {
  item: MapAbleHumanReviewItem;
  participantId: string;
  tenantId: string;
  missionId?: string | null;
  requestedBy: string;
  source: HumanOpsSource;
};
