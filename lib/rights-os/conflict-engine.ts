import { REASON_CODES, reason } from "@/lib/rights-os/reason-codes";
import type { RightsDataUseRequestInput, RightsDecisionReason } from "@/lib/rights-os/types";

export type PolicyConflictResult = {
  hasConflict: boolean;
  conflictType?: string;
  safeDefault: "deny" | "participant_review_required" | "human_review_required";
  reasons: RightsDecisionReason[];
  reviewOwner?: string;
};

export function detectPolicyConflicts(
  request: RightsDataUseRequestInput,
  context?: {
    activeDeletionRequest?: boolean;
    activeComplaint?: boolean;
    supporterFieldConflict?: boolean;
    employerDiagnosisRequest?: boolean;
  }
): PolicyConflictResult {
  const reasons: RightsDecisionReason[] = [];

  if (context?.employerDiagnosisRequest) {
    reasons.push(
      reason(
        REASON_CODES.CONFLICT_DETECTED,
        "An employer requested diagnosis for an adjustment. Functional requirements are the lower-disclosure alternative."
      )
    );
    return {
      hasConflict: true,
      conflictType: "employer_diagnosis_request",
      safeDefault: "participant_review_required",
      reasons,
      reviewOwner: "rights_officer",
    };
  }

  if (context?.supporterFieldConflict) {
    reasons.push(
      reason(
        REASON_CODES.CONFLICT_DETECTED,
        "A supporter requested a field the participant excluded. Supporter disagreement remains visible."
      )
    );
    return {
      hasConflict: true,
      conflictType: "supporter_field_conflict",
      safeDefault: "participant_review_required",
      reasons,
      reviewOwner: "participant",
    };
  }

  if (context?.activeDeletionRequest && context?.activeComplaint) {
    reasons.push(
      reason(
        REASON_CODES.CONFLICT_DETECTED,
        "A deletion request conflicts with an active complaint record. Human review is required."
      )
    );
    return {
      hasConflict: true,
      conflictType: "deletion_complaint_conflict",
      safeDefault: "human_review_required",
      reasons,
      reviewOwner: "rights_officer",
    };
  }

  if (request.context.emergencyContextId && !request.purposeCode) {
    reasons.push(
      reason(
        REASON_CODES.HUMAN_REVIEW_REQUIRED,
        "Emergency context does not bypass ordinary policy. Human review is required."
      )
    );
    return {
      hasConflict: true,
      conflictType: "emergency_exception",
      safeDefault: "human_review_required",
      reasons,
      reviewOwner: "rights_officer",
    };
  }

  return { hasConflict: false, safeDefault: "deny", reasons: [] };
}
