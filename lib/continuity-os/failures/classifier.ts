export type FailureClass =
  | "AVAILABILITY"
  | "ACCESSIBILITY"
  | "TIMING"
  | "COMMUNICATION"
  | "HANDOFF"
  | "QUALITY_AND_SAFETY"
  | "FINANCIAL"
  | "DATA_AND_AUTHORITY"
  | "ENVIRONMENTAL";

export type FailureSeverity =
  | "informational"
  | "attention"
  | "major"
  | "critical"
  | "human_safety_review_required";

export interface ClassificationInput {
  trigger:
    | "support_worker_cancellation"
    | "worker_no_show"
    | "accessible_transport_cancellation"
    | "inaccessible_replacement_vehicle"
    | "venue_closure"
    | "lift_outage"
    | "equipment_breakdown"
    | "equipment_delivery_delay"
    | "provider_withdrawal"
    | "inaccessible_document"
    | "unexpected_fee"
    | "failed_refund"
    | "lost_device"
    | "account_compromise"
    | "privacy_incident"
    | "handoff_rejected"
    | "regional_capacity_shortage"
    | "family_violence_safe_mode"
    | "participant_report"
    | "other";
  essentialServiceImpact: boolean;
  timeSensitive: boolean;
  noAlternative: boolean;
  safetyConcern: boolean;
  falseReassurance: boolean;
  hardRequirementFailed: boolean;
  dependentNodeCount: number;
  evidenceConfidence: "unverified" | "low" | "medium" | "high";
  /** Explicitly ignored — commercial tier must never affect severity. */
  subscriptionTier?: string;
}

const TRIGGER_CLASS: Record<ClassificationInput["trigger"], FailureClass> = {
  support_worker_cancellation: "AVAILABILITY",
  worker_no_show: "AVAILABILITY",
  accessible_transport_cancellation: "AVAILABILITY",
  inaccessible_replacement_vehicle: "ACCESSIBILITY",
  venue_closure: "AVAILABILITY",
  lift_outage: "ACCESSIBILITY",
  equipment_breakdown: "AVAILABILITY",
  equipment_delivery_delay: "TIMING",
  provider_withdrawal: "AVAILABILITY",
  inaccessible_document: "ACCESSIBILITY",
  unexpected_fee: "FINANCIAL",
  failed_refund: "FINANCIAL",
  lost_device: "DATA_AND_AUTHORITY",
  account_compromise: "DATA_AND_AUTHORITY",
  privacy_incident: "DATA_AND_AUTHORITY",
  handoff_rejected: "HANDOFF",
  regional_capacity_shortage: "AVAILABILITY",
  family_violence_safe_mode: "QUALITY_AND_SAFETY",
  participant_report: "AVAILABILITY",
  other: "AVAILABILITY",
};

/**
 * Deterministic classification of the service/environment — never the participant.
 */
export function classifyServiceFailure(input: ClassificationInput): {
  failureClass: FailureClass;
  severity: FailureSeverity;
  reasons: string[];
} {
  void input.subscriptionTier; // deliberately unused

  const failureClass = TRIGGER_CLASS[input.trigger];
  const reasons: string[] = [`trigger:${input.trigger}`];

  if (input.safetyConcern || input.trigger === "family_violence_safe_mode") {
    return {
      failureClass:
        input.trigger === "family_violence_safe_mode"
          ? "QUALITY_AND_SAFETY"
          : failureClass,
      severity: "human_safety_review_required",
      reasons: [...reasons, "safety_concern"],
    };
  }

  let score = 0;
  if (input.essentialServiceImpact) {
    score += 2;
    reasons.push("essential_service_impact");
  }
  if (input.timeSensitive) {
    score += 2;
    reasons.push("time_sensitive");
  }
  if (input.noAlternative) {
    score += 2;
    reasons.push("no_alternative");
  }
  if (input.hardRequirementFailed) {
    score += 2;
    reasons.push("hard_requirement_failed");
  }
  if (input.falseReassurance) {
    score += 2;
    reasons.push("false_reassurance");
  }
  if (input.dependentNodeCount >= 3) {
    score += 1;
    reasons.push("many_dependent_nodes");
  }
  if (input.evidenceConfidence === "unverified") {
    reasons.push("evidence_unverified");
  }

  let severity: FailureSeverity = "informational";
  if (score >= 6) severity = "critical";
  else if (score >= 4) severity = "major";
  else if (score >= 2) severity = "attention";

  return { failureClass, severity, reasons };
}
