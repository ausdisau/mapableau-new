import { describe, expect, it } from "vitest";

import { maybeBuildGoalPlanForAsk } from "@/lib/ask-mapable/goal-plan";

describe("Ask MapAble Goal Plan enrichment", () => {
  it("creates a bounded work-and-transport draft", () => {
    const plan = maybeBuildGoalPlanForAsk({
      query: "I want a part-time job at a library and to get there independently",
      intent: "combined",
    });

    expect(plan?.serviceCandidates.map((candidate) => candidate.module)).toEqual(
      expect.arrayContaining(["jobs", "transport"]),
    );
  });

  it("honours explicit one-at-a-time wording", () => {
    const plan = maybeBuildGoalPlanForAsk({
      query: "Help me plan work and transport, but ask me one at a time",
      intent: "combined",
    });

    expect(plan?.preferences).toContain("decision_mode:step_by_step");
  });

  it.each([
    "incident",
    "billing",
    "health",
    "provider_finder",
    "ndis",
  ] as const)("does not attach Goal Plan semantics to %s", (intent) => {
    expect(
      maybeBuildGoalPlanForAsk({
        query: "help me",
        intent,
      }),
    ).toBeNull();
  });
});
