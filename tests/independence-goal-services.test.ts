import { describe, expect, it } from "vitest";

import {
  buildGoalPlanDraft,
  setGoalPlanDecision,
} from "@mapable/contracts";

describe("Goal Plan shared contract", () => {
  it("suggests Jobs and Transport for explicit work-and-travel intent", () => {
    const draft = buildGoalPlanDraft(
      "I want to work three days a week at a library and stop depending on my parents to get there",
    );

    expect(draft.needsClarification).toBe(false);
    expect(draft.serviceCandidates.map((candidate) => candidate.module)).toEqual(
      expect.arrayContaining(["jobs", "transport"]),
    );
    expect(
      draft.serviceCandidates.every(
        (candidate) => candidate.decision === "undecided",
      ),
    ).toBe(true);
  });

  it("suggests Access for explicit accessibility intent", () => {
    const draft = buildGoalPlanDraft(
      "I want a cafe with step-free entry and an accessible toilet near work",
    );

    expect(
      draft.serviceCandidates.some((candidate) => candidate.module === "access"),
    ).toBe(true);
  });

  it("does not infer Care from diagnosis or disability language alone", () => {
    const draft = buildGoalPlanDraft(
      "I have cerebral palsy and use a wheelchair. I want a job at a library.",
    );

    expect(
      draft.serviceCandidates.some((candidate) => candidate.module === "care"),
    ).toBe(false);
  });

  it("creates Care only from explicit support intent", () => {
    const draft = buildGoalPlanDraft(
      "I want a support worker to help with my morning routine before work",
    );
    const care = draft.serviceCandidates.find(
      (candidate) => candidate.module === "care",
    );

    expect(care).toBeDefined();
    expect(care?.requiresExplicitChoice).toBe(true);
    expect(care?.sensitivity).toBe("sensitive");
    expect(care?.decision).toBe("undecided");
  });

  it("never creates default disclosure permissions", () => {
    const draft = buildGoalPlanDraft(
      "I want a job and accessible transport to work",
    );

    expect(draft.disclosurePermissions).toEqual([]);
  });

  it.each(["yes", "no", "not_sure"] as const)(
    "preserves participant decision %s",
    (decision) => {
      const draft = buildGoalPlanDraft("I want a job");
      const updated = setGoalPlanDecision(draft, "jobs", decision);

      expect(
        updated.serviceCandidates.find(
          (candidate) => candidate.module === "jobs",
        )?.decision,
      ).toBe(decision);
      expect(updated.disclosurePermissions).toEqual([]);
    },
  );

  it("asks for clarification for an empty goal", () => {
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
