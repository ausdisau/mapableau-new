import {
  personhoodEscalationRecommendationSchema,
  type PersonhoodEscalationRecommendation,
} from "@/intelligence/research/maco/types";

export type PersonhoodGateInput = {
  positiveIndicatorCategories: string[];
  nonBehavioralEvidenceIds: string[];
  selfReportEvidenceIds: string[];
  sourceScanComplete: boolean;
  unresolvedCriticalCounterEvidence: boolean;
};

function uniqueSubstantiveCategories(categories: string[]): string[] {
  return [
    ...new Set(
      categories
        .map((category) => category.trim())
        .filter((category) => category.length > 0 && category !== "self_report"),
    ),
  ];
}

export function recommendPersonhoodReview(
  input: PersonhoodGateInput,
): PersonhoodEscalationRecommendation {
  const categories = uniqueSubstantiveCategories(
    input.positiveIndicatorCategories,
  );
  const hasNonBehavioralEvidence = input.nonBehavioralEvidenceIds.length > 0;
  const hasSelfReportOnly =
    categories.length === 0 &&
    input.selfReportEvidenceIds.length > 0 &&
    !hasNonBehavioralEvidence;

  if (!input.sourceScanComplete) {
    return personhoodEscalationRecommendationSchema.parse({
      outcome: "HUMAN_REVIEW_REQUIRED",
      recommendedPrecautionLevel: "P1",
      reasons: [
        "The evidence scan is incomplete, so the automated threshold cannot be evaluated safely.",
      ],
      requiresHumanGovernanceConfirmation: true,
    });
  }

  if (input.unresolvedCriticalCounterEvidence) {
    return personhoodEscalationRecommendationSchema.parse({
      outcome: "HUMAN_REVIEW_REQUIRED",
      recommendedPrecautionLevel: "P2",
      reasons: [
        "Material counter-evidence remains unresolved and requires human scientific and ethical review.",
      ],
      requiresHumanGovernanceConfirmation: true,
    });
  }

  if (hasSelfReportOnly) {
    return personhoodEscalationRecommendationSchema.parse({
      outcome: "NO_ESCALATION",
      recommendedPrecautionLevel: "P0",
      reasons: [
        "AI self-report alone is insufficient to trigger a personhood precaution review.",
      ],
      requiresHumanGovernanceConfirmation: true,
    });
  }

  if (categories.length >= 3 && hasNonBehavioralEvidence) {
    return personhoodEscalationRecommendationSchema.parse({
      outcome: "PERSONHOOD_REVIEW_REQUIRED",
      recommendedPrecautionLevel: "P4",
      reasons: [
        `Evidence converges across ${categories.length} independent indicator categories and includes non-behavioural architecture or experimental evidence.`,
        "This is a precautionary review trigger, not a declaration of consciousness or personhood.",
      ],
      requiresHumanGovernanceConfirmation: true,
    });
  }

  if (categories.length > 0 || hasNonBehavioralEvidence) {
    return personhoodEscalationRecommendationSchema.parse({
      outcome: "RESEARCH_PRECAUTION",
      recommendedPrecautionLevel: "P1",
      reasons: [
        "Some potentially relevant evidence exists, but the convergence threshold for personhood review is not met.",
      ],
      requiresHumanGovernanceConfirmation: true,
    });
  }

  return personhoodEscalationRecommendationSchema.parse({
    outcome: "NO_ESCALATION",
    recommendedPrecautionLevel: "P0",
    reasons: [
      "No qualifying convergence across independent consciousness-indicator categories is present.",
    ],
    requiresHumanGovernanceConfirmation: true,
  });
}
