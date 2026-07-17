export type BreachAssessmentInput = {
  personalDataInvolved: boolean;
  confidentialityCompromised: boolean;
  integrityCompromised: boolean;
  availabilityCompromised: boolean;
  likelyHarm: boolean;
};

export type BreachAssessmentResult = {
  likelyNotifiable: boolean;
  failClosed: true;
  reasons: string[];
};

/** Fail closed: uncertain harm still escalates for human review. */
export function assessPrivacyBreach(
  input: BreachAssessmentInput
): BreachAssessmentResult {
  const reasons: string[] = [];

  if (!input.personalDataInvolved) {
    return {
      likelyNotifiable: false,
      failClosed: true,
      reasons: ["no_personal_data_flagged"],
    };
  }

  if (input.confidentialityCompromised) reasons.push("confidentiality");
  if (input.integrityCompromised) reasons.push("integrity");
  if (input.availabilityCompromised) reasons.push("availability");
  if (input.likelyHarm) reasons.push("likely_harm");

  if (reasons.length === 0) {
    return {
      likelyNotifiable: true,
      failClosed: true,
      reasons: ["uncertain_impact_escalate"],
    };
  }

  return {
    likelyNotifiable: true,
    failClosed: true,
    reasons,
  };
}
