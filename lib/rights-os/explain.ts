import { REASON_TEMPLATES, type ReasonCode } from "@/lib/rights-os/reason-codes";
import type { RightsPolicyDecisionResult, RightsPolicyOutcome } from "@/lib/rights-os/types";

const OUTCOME_LABELS: Record<RightsPolicyOutcome, string> = {
  allow: "Allowed",
  allow_with_duties: "Allowed with duties",
  deny: "Denied",
  participant_review_required: "Participant review required",
  human_review_required: "Human review required",
};

export function explainPolicyDecision(decision: RightsPolicyDecisionResult): {
  decision: string;
  reasons: string[];
  allowedSummary: string;
  deniedSummary: string;
  participantAction: string;
} {
  const reasonLines = decision.reasons.map((r) => {
    const template = REASON_TEMPLATES[r.code as ReasonCode];
    return r.field ? `${r.message}` : (template ?? r.message);
  });

  const allowedSummary =
    decision.allowedFields.length > 0
      ? `Allowed: ${decision.allowedFields.join(", ")}.`
      : "No fields allowed.";

  const deniedSummary =
    decision.deniedFields.length > 0
      ? `Not allowed: ${decision.deniedFields.join(", ")}.`
      : "";

  let participantAction = "No action required.";
  switch (decision.outcome) {
    case "participant_review_required":
    case "allow_with_duties":
      participantAction = "Review the allowed fields and approve or refuse sharing.";
      break;
    case "human_review_required":
      participantAction = "A human rights officer will review this request. You may contact privacy help.";
      break;
    case "deny":
      participantAction = "You may refuse or request a lower-disclosure alternative.";
      break;
    case "allow":
      participantAction = "Sharing is permitted for the allowed fields.";
      break;
    default: {
      const _exhaustive: never = decision.outcome;
      participantAction = String(_exhaustive);
    }
  }

  return {
    decision: OUTCOME_LABELS[decision.outcome],
    reasons: reasonLines,
    allowedSummary,
    deniedSummary,
    participantAction,
  };
}
