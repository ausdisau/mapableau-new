/**
 * Operator and participant presentation for Human Operations (Prompt 08).
 */

import type {
  HumanOpsReviewItem,
  OperatorReviewView,
  ParticipantReviewVisibility,
} from "./types";

const CATEGORY_LABELS: Record<HumanOpsReviewItem["category"], string> = {
  care_coordination: "Care coordination",
  transport_continuity: "Transport continuity",
  access_evidence: "Access evidence",
  authority_review: "Authority review",
  financial_review: "Financial review",
  credential_exception: "Credential exception",
  employment_disclosure_review: "Employment disclosure",
  safeguarding: "Safeguarding (human-only)",
  general_coordination: "General coordination",
};

export function formatReviewForParticipant(
  item: HumanOpsReviewItem,
): ParticipantReviewVisibility {
  const isSafeguarding = item.category === "safeguarding";
  return {
    reviewId: item.reviewId,
    whyNeeded: item.participantFacingReason,
    status: item.status,
    handlingTeam: item.handlingTeam,
    informationUsed: isSafeguarding
      ? item.evidenceRefs.map(
          () => "Information you supplied (details held securely)",
        )
      : item.evidenceRefs.map((ref) => `Reference: ${ref}`),
    whatHappensNext: item.whatHappensNext,
    categoryLabel: CATEGORY_LABELS[item.category],
    protectedInternalDetailExcluded: true,
  };
}

export function formatReviewForOperator(
  item: HumanOpsReviewItem,
): OperatorReviewView {
  const safeguarding = item.category === "safeguarding";
  return {
    reviewId: item.reviewId,
    missionId: item.missionId,
    participantId: item.participantId,
    tenantId: item.tenantId,
    category: item.category,
    priority: item.priority,
    status: item.status,
    reasonCodes: item.reasonCodes,
    evidenceRefs: item.evidenceRefs,
    assignedTo: item.assignedTo,
    createdAt: item.createdAt,
    dueAt: item.dueAt,
    internalNotes: item.internalNotes,
    participantFacingReason: item.participantFacingReason,
    resolution: item.resolution,
    auditRefs: item.auditRefs,
    preparedNextStepIds: item.preparedNextStepIds,
    authorityReminder: safeguarding
      ? "Safeguarding is human-only. You may organise factual records and route the case. You must not determine substantiation, reportability, sanction, restrictive-practice approval, or incident closure in this console. Participant approval remains required for participant-bound actions unless recorded delegate authority applies."
      : "Human review is not unrestricted authority. Actions remain subject to role and policy. You cannot approve on behalf of the participant unless existing delegate authority explicitly allows — and that must be recorded. Prepared next steps are not executed here.",
    safeguardingBoundaryActive: safeguarding,
  };
}

export function formatQueueRowForOperator(item: HumanOpsReviewItem): {
  id: string;
  reviewId: string;
  category: string;
  priority: string;
  status: string;
  participantId: string;
  missionId: string | null;
  assignedTo: string | null;
  createdAt: string;
  dueAt: string | null;
  href: string;
  safeguarding: boolean;
} {
  return {
    id: item.reviewId,
    reviewId: item.reviewId,
    category: CATEGORY_LABELS[item.category],
    priority: item.priority,
    status: item.status,
    participantId: item.participantId,
    missionId: item.missionId,
    assignedTo: item.assignedTo,
    createdAt: item.createdAt,
    dueAt: item.dueAt,
    href: `/admin/ai/human-ops/${item.reviewId}`,
    safeguarding: item.category === "safeguarding",
  };
}

export const HUMAN_OPS_A11Y = {
  queueTableCaption:
    "Human operations review queue. Use Tab to reach row links and Enter to open a review.",
  reviewLandmark: "Human operations review detail",
  resolveFormLabel: "Record resolution — does not execute actions",
  assignFormLabel: "Assign review to operator",
  liveRegionPolite: "polite",
  skipToQueue: "Skip to review queue",
  keyboardHints: [
    "Tab moves between filters, refresh, and queue rows",
    "Enter on a row link opens the review detail",
    "Esc returns focus to the queue landmark when supported by the page shell",
    "All form controls have visible labels; errors are announced via role=alert",
  ],
} as const;
