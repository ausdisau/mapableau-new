import { describe, expect, it } from "vitest";

import {
  STEP_BY_STEP_PREFERENCE,
  buildGoalPlanDraft,
  nextConversationalCandidate,
  shouldAskConversationally,
  type GoalServiceCandidate,
} from "@mapable/contracts";

describe("C3 adaptive conversation", () => {
  it("does not interrupt for ordinary high-confidence candidates", () => {
    const plan = buildGoalPlanDraft(
      "I want a part-time job and transport to work",
    );

    expect(
      plan.serviceCandidates.every(
        (candidate) => candidate.askConversationally === false,
      ),
    ).toBe(true);
    expect(nextConversationalCandidate(plan)).toBeNull();
  });

  it("asks Care conversationally", () => {
    const plan = buildGoalPlanDraft(
      "I want a support worker to help me get ready before work",
    );

    const care = plan.serviceCandidates.find(
      (candidate) => candidate.module === "care",
    );
    expect(care?.question).toContain(
      "Would you like me to include Care in this Goal Plan?",
    );
    expect(nextConversationalCandidate(plan)?.module).toBe("care");
  });

  it("asks when sensitive disclosure is proposed", () => {
    const candidate: GoalServiceCandidate = {
      module: "jobs",
      reasonSuggested: "Workplace adjustments may be relevant.",
      participantBenefit: "Discuss adjustments on your terms.",
      question: "Would you like to decide what can be shared?",
      decision: "undecided",
      confidence: "high",
      sensitivity: "ordinary",
      askConversationally: false,
      requiresExplicitChoice: false,
      requirements: [],
      nonNegotiables: [],
      uncertainties: [],
      dataRequired: [],
      proposedDisclosure: ["employer:accessibilityRequirements"],
    };

    expect(shouldAskConversationally(candidate)).toBe(true);
  });

  it("honours an explicit step-by-step preference", () => {
    const plan = buildGoalPlanDraft(
      "I want a job and transport to work",
      { stepByStep: true },
    );

    expect(plan.preferences).toContain(STEP_BY_STEP_PREFERENCE);
    expect(nextConversationalCandidate(plan)?.module).toBe("jobs");
  });
});
