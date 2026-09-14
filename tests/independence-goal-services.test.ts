import { describe, expect, it } from "vitest";

import { buildGoalPlanDraft } from "../apps/independence/src/goal-services/goalPlan";

describe("buildGoalPlanDraft", () => {
  it("suggests Jobs and Transport for an explicit work-and-travel goal", () => {
    const draft = buildGoalPlanDraft(
      "I want to work three days a week at a library and stop depending on my parents to get there",
    );

    expect(draft.needsClarification).toBe(false);
    expect(draft.serviceCandidates.map((candidate) => candidate.module)).toEqual(
      expect.arrayContaining(["jobs", "transport"]),
    );
    expect(draft.serviceCandidates.every((candidate) => candidate.decision === "undecided")).toBe(
      true,
    );
  });

  it("suggests Access when the goal explicitly asks about accessibility", () => {
    const draft = buildGoalPlanDraft(
      "I want to find a cafe with step-free entry and an accessible toilet near work",
    );

    expect(draft.serviceCandidates.some((candidate) => candidate.module === "access")).toBe(true);
  });

  it("does not infer Care from diagnosis or disability language alone", () => {
    const draft = buildGoalPlanDraft(
      "I have cerebral palsy and use a wheelchair. I want to find a job at a library.",
    );

    expect(draft.serviceCandidates.some((candidate) => candidate.module === "care")).toBe(false);
  });

  it("suggests Care only from explicit support intent and marks it ask-first", () => {
    const draft = buildGoalPlanDraft(
      "I want help from a support worker with my morning routine before I travel to work",
    );

    const care = draft.serviceCandidates.find((candidate) => candidate.module === "care");
    expect(care).toBeDefined();
    expect(care?.requiresExplicitChoice).toBe(true);
    expect(care?.decision).toBe("undecided");
  });

  it("never creates default disclosure permissions", () => {
    const draft = buildGoalPlanDraft(
      "I want to work at a library and arrange accessible transport there",
    );

    expect(draft.disclosurePermissions).toEqual([]);
  });

  it("asks for clarification when the goal is empty", () => {
    const draft = buildGoalPlanDraft("   ");

    expect(draft.needsClarification).toBe(true);
    expect(draft.serviceCandidates).toEqual([]);
  });

  it("asks for clarification when no bounded MapAble service is identified", () => {
    const draft = buildGoalPlanDraft("I want my life to feel better");

    expect(draft.needsClarification).toBe(true);
    expect(draft.serviceCandidates).toEqual([]);
  });
});
