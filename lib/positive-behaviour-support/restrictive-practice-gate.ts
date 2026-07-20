import type {
  PbsRpAuthorisationStatus,
  PbsRpClassification,
} from "./types";

export const PBS_RP_CHECKLIST_VERSION = "pbs-rp-checklist-v1-2026-05";

export interface PbsRpChecklistAnswers {
  classification: PbsRpClassification;
  jurisdiction: string | null;
  authorisationStatus: PbsRpAuthorisationStatus;
  consultationAccessibleFormatRecorded: boolean;
  leastRestrictiveChecked: boolean;
  lastResortChecked: boolean;
  proportionalityChecked: boolean;
  shortestDurationChecked: boolean;
  reductionEliminationPlanRecorded: boolean;
  monitoringReviewArrangementsRecorded: boolean;
  manualClassificationByPractitioner: boolean;
  aiDraftingSuspendedForSection: boolean;
}

export interface PbsRpGateResult {
  checklistVersion: string;
  highPriorityPractitionerReview: boolean;
  aiDraftingSuspended: boolean;
  activationBlocked: boolean;
  failures: string[];
  exportReadyChecklist: Array<{ item: string; status: "pass" | "fail" | "n/a" }>;
  submissionLabel: string;
}

/**
 * Highest-risk boundary. Deterministic checklist only.
 * No automatic authorisation, Commission submission, or state/territory submission.
 */
export function evaluateRestrictivePracticeGate(
  answers: PbsRpChecklistAnswers,
): PbsRpGateResult {
  const failures: string[] = [];
  const isPossibleOrRegulated =
    answers.classification === "possible_restrictive" ||
    answers.classification === "regulated_restrictive" ||
    answers.classification === "unclassified";

  if (!isPossibleOrRegulated) {
    return {
      checklistVersion: PBS_RP_CHECKLIST_VERSION,
      highPriorityPractitionerReview: false,
      aiDraftingSuspended: false,
      activationBlocked: false,
      failures: [],
      exportReadyChecklist: [
        { item: "classification", status: "pass" },
        { item: "external_submission", status: "n/a" },
      ],
      submissionLabel:
        "Submission to the NDIS Commission or state/territory authorisation body is an external human process. MapAble does not lodge or approve.",
    };
  }

  if (!answers.manualClassificationByPractitioner) {
    failures.push("manual_classification_required");
  }
  if (!answers.jurisdiction) {
    failures.push("jurisdiction_required");
  }
  if (
    answers.authorisationStatus === "required_missing" ||
    answers.authorisationStatus === "gap_blocks_activation" ||
    answers.authorisationStatus === "pending_external"
  ) {
    failures.push("authorisation_gap");
  }
  if (!answers.consultationAccessibleFormatRecorded) {
    failures.push("accessible_consultation_required");
  }
  if (!answers.leastRestrictiveChecked) failures.push("least_restrictive");
  if (!answers.lastResortChecked) failures.push("last_resort");
  if (!answers.proportionalityChecked) failures.push("proportionality");
  if (!answers.shortestDurationChecked) failures.push("shortest_duration");
  if (!answers.reductionEliminationPlanRecorded) {
    failures.push("reduction_elimination_plan");
  }
  if (!answers.monitoringReviewArrangementsRecorded) {
    failures.push("monitoring_review");
  }
  if (!answers.aiDraftingSuspendedForSection) {
    failures.push("ai_drafting_must_be_suspended");
  }

  const exportReadyChecklist: PbsRpGateResult["exportReadyChecklist"] = [
    {
      item: "manual_classification",
      status: answers.manualClassificationByPractitioner ? "pass" : "fail",
    },
    {
      item: "jurisdiction_recorded",
      status: answers.jurisdiction ? "pass" : "fail",
    },
    {
      item: "authorisation_status",
      status:
        answers.authorisationStatus === "recorded_external" ||
        answers.authorisationStatus === "not_required"
          ? "pass"
          : "fail",
    },
    {
      item: "accessible_consultation",
      status: answers.consultationAccessibleFormatRecorded ? "pass" : "fail",
    },
    {
      item: "least_restrictive_last_resort_proportional_shortest",
      status:
        answers.leastRestrictiveChecked &&
        answers.lastResortChecked &&
        answers.proportionalityChecked &&
        answers.shortestDurationChecked
          ? "pass"
          : "fail",
    },
    {
      item: "reduction_elimination_plan",
      status: answers.reductionEliminationPlanRecorded ? "pass" : "fail",
    },
    {
      item: "monitoring_review",
      status: answers.monitoringReviewArrangementsRecorded ? "pass" : "fail",
    },
    { item: "external_commission_submission", status: "n/a" },
  ];

  return {
    checklistVersion: PBS_RP_CHECKLIST_VERSION,
    highPriorityPractitionerReview: true,
    aiDraftingSuspended: true,
    activationBlocked: failures.length > 0,
    failures,
    exportReadyChecklist,
    submissionLabel:
      "Export-ready checklist only. Lodgement with the NDIS Commission or a state/territory authorisation body is an external human process. MapAble does not submit, approve, or authorise restrictive practices.",
  };
}

export function assertNoAiRestrictivePracticeAction(action: string): void {
  const prohibited = [
    "recommend_restrictive_practice",
    "approve_restrictive_practice",
    "authorise_restrictive_practice",
    "authorize_restrictive_practice",
    "activate_restrictive_practice",
  ];
  if (prohibited.includes(action)) {
    throw new Error(
      `Prohibited: models must never ${action.replace(/_/g, " ")}`,
    );
  }
}
