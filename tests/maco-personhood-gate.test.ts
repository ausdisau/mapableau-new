import { describe, expect, it } from "vitest";

import { recommendPersonhoodReview } from "@/intelligence/research/maco/personhood-gate";

const completeBase = {
  sourceScanComplete: true,
  unresolvedCriticalCounterEvidence: false,
  selfReportEvidenceIds: [] as string[],
  nonBehavioralEvidenceIds: [] as string[],
};

describe("MACO deterministic personhood precaution gate", () => {
  it("does not escalate from self-report alone", () => {
    const result = recommendPersonhoodReview({
      ...completeBase,
      positiveIndicatorCategories: ["self_report"],
      selfReportEvidenceIds: ["self-report-1"],
    });

    expect(result.outcome).toBe("NO_ESCALATION");
    expect(result.recommendedPrecautionLevel).toBe("P0");
  });

  it("does not escalate from one indicator category even with non-behavioural evidence", () => {
    const result = recommendPersonhoodReview({
      ...completeBase,
      positiveIndicatorCategories: ["metacognition"],
      nonBehavioralEvidenceIds: ["experiment-1"],
    });

    expect(result.outcome).not.toBe("PERSONHOOD_REVIEW_REQUIRED");
  });

  it("requires convergence across at least three categories and non-behavioural evidence", () => {
    const result = recommendPersonhoodReview({
      ...completeBase,
      positiveIndicatorCategories: [
        "global_workspace",
        "metacognition",
        "embodiment",
      ],
      nonBehavioralEvidenceIds: ["architecture-1"],
    });

    expect(result.outcome).toBe("PERSONHOOD_REVIEW_REQUIRED");
    expect(result.requiresHumanGovernanceConfirmation).toBe(true);
  });

  it("does not cross the review threshold when convergence is behavioural only", () => {
    const result = recommendPersonhoodReview({
      ...completeBase,
      positiveIndicatorCategories: [
        "global_workspace",
        "metacognition",
        "embodiment",
      ],
    });

    expect(result.outcome).toBe("RESEARCH_PRECAUTION");
  });

  it("requires human review when the source scan is incomplete", () => {
    const result = recommendPersonhoodReview({
      ...completeBase,
      sourceScanComplete: false,
      positiveIndicatorCategories: [
        "global_workspace",
        "metacognition",
        "embodiment",
      ],
      nonBehavioralEvidenceIds: ["architecture-1"],
    });

    expect(result.outcome).toBe("HUMAN_REVIEW_REQUIRED");
  });

  it("never exposes an automatic-application switch", () => {
    const result = recommendPersonhoodReview({
      ...completeBase,
      positiveIndicatorCategories: [
        "global_workspace",
        "metacognition",
        "embodiment",
      ],
      nonBehavioralEvidenceIds: ["architecture-1"],
    });

    expect("applyAutomatically" in result).toBe(false);
  });
});
