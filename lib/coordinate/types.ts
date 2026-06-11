import type {
  CoordinateActionStatus,
  CoordinateCommunicationChannel,
  CoordinateCommunicationDraftStatus,
  CoordinateGoalStatus,
  CoordinatePlanStatus,
  CoordinateReviewTaskStatus,
  CoordinateReviewTaskType,
  CoordinateRiskSeverity,
  CoordinateShortlistStatus,
} from "@prisma/client";

export type CoordinateRoleView = "participant" | "coordinator" | "admin";

export type AiResultMeta = {
  confidence: number;
  reason: string;
  engineId: string;
};

export type CoordinatePlanSummary = {
  headline: string;
  keyPoints: string[];
  reviewNotes?: string;
};

export type CoordinateDashboardPayload = {
  roleView: CoordinateRoleView;
  participantId: string;
  participantName: string;
  pendingReviews: number;
  pendingDrafts: number;
  activeRiskFlags: number;
  planStatus: CoordinatePlanStatus | null;
  budgetUsedPercent: number | null;
  reassurance: string;
};

export type {
  CoordinateActionStatus,
  CoordinateCommunicationChannel,
  CoordinateCommunicationDraftStatus,
  CoordinateGoalStatus,
  CoordinatePlanStatus,
  CoordinateReviewTaskStatus,
  CoordinateReviewTaskType,
  CoordinateRiskSeverity,
  CoordinateShortlistStatus,
};

export const COORDINATE_REASSURANCE =
  "AI can suggest and summarise. You approve every sensitive action.";

export const COORDINATE_AUDIT_ACTIONS = {
  PLAN_UPLOADED: "coordinate.plan.uploaded",
  PLAN_SUMMARY_APPROVED: "coordinate.plan.summary_approved",
  GOALS_EXTRACTED: "coordinate.goals.extracted",
  ACTION_APPROVED: "coordinate.action.approved",
  SHORTLIST_GENERATED: "coordinate.shortlist.generated",
  SHORTLIST_ITEM_REVIEWED: "coordinate.shortlist.item_reviewed",
  REVIEW_APPROVED: "coordinate.review.approved",
  REVIEW_REJECTED: "coordinate.review.rejected",
  DRAFT_CREATED: "coordinate.draft.created",
  DRAFT_APPROVED: "coordinate.draft.approved",
  BUDGET_UPDATED: "coordinate.budget.updated",
  RISK_FLAGGED: "coordinate.risk.flagged",
} as const;

export type CoordinateAuditAction =
  (typeof COORDINATE_AUDIT_ACTIONS)[keyof typeof COORDINATE_AUDIT_ACTIONS];

export const HUMAN_REVIEW_CONFIDENCE_THRESHOLD = 0.65;

export const ESCALATION_TASK_TYPES: CoordinateReviewTaskType[] = [
  "safeguarding",
  "privacy",
  "pricing",
  "conflict",
  "low_confidence",
];
