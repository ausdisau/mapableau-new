import { randomUUID } from "crypto";

import { compileFields } from "@/lib/rights-os/field-compiler";
import { detectPolicyConflicts } from "@/lib/rights-os/conflict-engine";
import {
  getPurpose,
  PURPOSE_REGISTRY_VERSION,
  validatePurposeCode,
} from "@/lib/rights-os/purpose-registry";
import { REASON_CODES, reason } from "@/lib/rights-os/reason-codes";
import type {
  RightsDataOperation,
  RightsDataUseRequestInput,
  RightsDuty,
  RightsPolicyDecisionResult,
  RightsPolicyOutcome,
  RightsProhibition,
} from "@/lib/rights-os/types";

const DUTY_LABELS: Record<string, string> = {
  use_only_for_purpose: "Use only for the stated purpose",
  delete_after_use: "Delete after use",
  no_onward_share: "Do not share onward",
  no_marketing: "Do not use for marketing",
};

export function evaluatePolicy(
  input: RightsDataUseRequestInput,
  conflictContext?: Parameters<typeof detectPolicyConflicts>[1]
): RightsPolicyDecisionResult {
  const evaluatedAt = new Date().toISOString();
  const decisionId = randomUUID();
  const reasons = [];

  const purposeValidation = validatePurposeCode(input.purposeCode);
  if (!purposeValidation.valid) {
    const code = purposeValidation.reason ?? REASON_CODES.PURPOSE_MISSING;
    reasons.push(reason(code as typeof REASON_CODES.PURPOSE_MISSING, `Purpose validation failed: ${code}`));
    return buildDecision({
      decisionId,
      requestId: input.requestId,
      outcome: code === REASON_CODES.HUMAN_REVIEW_REQUIRED ? "human_review_required" : "deny",
      reasons,
      evaluatedAt,
    });
  }

  const purpose = getPurpose(input.purposeCode)!;
  const conflict = detectPolicyConflicts(input, conflictContext);
  if (conflict.hasConflict) {
    reasons.push(...conflict.reasons);
    if (
      conflict.safeDefault === "human_review_required" ||
      conflict.safeDefault === "deny"
    ) {
      return buildDecision({
        decisionId,
        requestId: input.requestId,
        outcome: conflict.safeDefault,
        reasons,
        evaluatedAt,
        requiredApprovals:
          conflict.safeDefault === "human_review_required"
            ? ["rights_officer"]
            : [],
      });
    }
  }

  const compiled = compileFields({
    purposeCode: input.purposeCode,
    requestedFields: input.requestedFields,
    recipientRole: input.requester.role,
    requestedOperations: [...input.requestedOperations],
  });
  reasons.push(...compiled.reasons);

  const allowedFields = compiled.required;
  const deniedFields = [...compiled.prohibited];

  const allowedOperations = input.requestedOperations.filter((op) =>
    purpose.allowedOperations.includes(op)
  );
  const deniedOperations = input.requestedOperations.filter(
    (op) => !purpose.allowedOperations.includes(op)
  );

  if (deniedOperations.length > 0) {
    for (const op of deniedOperations) {
      reasons.push(
        reason(REASON_CODES.OPERATION_NOT_ALLOWED, `Operation ${op} denied for this purpose.`)
      );
    }
  }

  if (input.onwardSharingRequested && purpose.onwardSharing === "prohibited") {
    reasons.push(
      reason(REASON_CODES.ONWARD_SHARING_PROHIBITED, "Onward sharing is prohibited for this purpose.")
    );
  }

  let outcome: RightsPolicyOutcome = "allow";

  if (deniedFields.length > 0 && allowedFields.length === 0) {
    outcome = "deny";
  } else if (purpose.humanReviewRequired || compiled.humanReviewRequired) {
    outcome = "human_review_required";
    reasons.push(
      reason(REASON_CODES.HUMAN_REVIEW_REQUIRED, "This purpose requires human review.")
    );
  } else if (purpose.participantReviewRequired || deniedFields.length > 0) {
    outcome = "participant_review_required";
    reasons.push(
      reason(
        REASON_CODES.PARTICIPANT_REVIEW_REQUIRED,
        "The participant must review which fields may be shared."
      )
    );
  }

  const duties: RightsDuty[] = (purpose.requiredDuties ?? []).map((code) => ({
    code,
    description: DUTY_LABELS[code] ?? code,
  }));

  const prohibitions: RightsProhibition[] = [];
  if (purpose.onwardSharing === "prohibited") {
    prohibitions.push({ code: "no_onward_share", description: "Onward sharing prohibited" });
  }
  prohibitions.push({ code: "no_marketing", description: "Marketing use prohibited" });

  const expiresAt = purpose.defaultDurationHours
    ? new Date(Date.now() + purpose.defaultDurationHours * 3600_000).toISOString()
    : input.requestedUntil;

  const finalOutcome =
    duties.length > 0 && outcome === "allow" ? "allow_with_duties" : outcome;

  return buildDecision({
    decisionId,
    requestId: input.requestId,
    outcome: finalOutcome,
    allowedFields,
    deniedFields,
    allowedOperations,
    deniedOperations,
    duties: finalOutcome === "allow_with_duties" || finalOutcome === "allow" ? duties : [],
    prohibitions,
    requiredApprovals:
      finalOutcome === "participant_review_required" ||
      finalOutcome === "allow_with_duties"
        ? ["participant"]
        : finalOutcome === "human_review_required"
          ? ["rights_officer"]
          : [],
    reasons,
    expiresAt,
    evaluatedAt,
  });
}

function buildDecision(params: {
  decisionId: string;
  requestId: string;
  outcome: RightsPolicyOutcome;
  reasons: ReturnType<typeof reason>[];
  evaluatedAt: string;
  allowedFields?: string[];
  deniedFields?: string[];
  allowedOperations?: RightsDataOperation[];
  deniedOperations?: RightsDataOperation[];
  duties?: RightsDuty[];
  prohibitions?: RightsProhibition[];
  requiredApprovals?: string[];
  expiresAt?: string;
}): RightsPolicyDecisionResult {
  return {
    decisionId: params.decisionId,
    requestId: params.requestId,
    outcome: params.outcome,
    allowedFields: params.allowedFields ?? [],
    deniedFields: params.deniedFields ?? [],
    allowedOperations: params.allowedOperations ?? [],
    deniedOperations: params.deniedOperations ?? [],
    duties: params.duties ?? [],
    prohibitions: params.prohibitions ?? [],
    requiredApprovals: params.requiredApprovals ?? [],
    requiredAuthorityRecords: [],
    expiresAt: params.expiresAt,
    reasons: params.reasons,
    policyVersion: PURPOSE_REGISTRY_VERSION,
    evaluatedAt: params.evaluatedAt,
  };
}
