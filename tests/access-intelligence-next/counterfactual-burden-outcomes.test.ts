import { beforeEach, describe, expect, it } from "vitest";

import {
  buildJourneyBurdenProfile,
  clearShadowOutcomes,
  runAccessCounterfactual,
  recordJourneyOutcome,
  taylorRoom312Query,
} from "@/lib/access-intelligence-next";

describe("Access counterfactuals", () => {
  it("simulates lift failure without external actions", () => {
    const result = runAccessCounterfactual({
      query: taylorRoom312Query(),
      requirementSetRef: "fixture:taylor-harbour-v1",
      scenario: "lift_failure",
    });

    expect(result.externalActionsExecuted).toBe(false);
    expect(result.productionClaim).toBe("none");
    expect(result.simulatedConclusion).toBe("blocked_by_hard_requirement");
    expect(result.affectedDependencies.some((d) => /lift/i.test(d))).toBe(true);
    expect(result.invalidAlternatives.some((a) => !a.valid)).toBe(true);
    expect(
      result.invalidAlternatives.some((a) => /step_free|staff/i.test(a.reason)),
    ).toBe(true);
    expect(result.validAlternatives.length).toBeGreaterThan(0);
    expect(result.listAlternative.length).toBe(
      result.validAlternatives.length + result.invalidAlternatives.length,
    );
  });

  it("rejects inaccessible replacement as false recovery", () => {
    const result = runAccessCounterfactual({
      query: taylorRoom312Query(),
      requirementSetRef: "fixture:taylor-harbour-v1",
      scenario: "inaccessible_replacement",
    });
    expect(result.simulatedConclusion).toBe("fallback_unverified");
    expect(
      result.invalidAlternatives.some((a) => /unknown hoist|hard requirement/i.test(a.reason)),
    ).toBe(true);
  });
});

describe("Participant burden engine", () => {
  it("attributes burden to organisations and never scores the participant", () => {
    const profile = buildJourneyBurdenProfile({
      query: taylorRoom312Query(),
      requirementSetRef: "fixture:taylor-harbour-v1",
    });

    expect(profile.notAParticipantScore).toBe(true);
    expect(profile.productionClaim).toBe("none");
    expect(profile.totals.confirmations).toBeGreaterThan(0);
    expect(profile.events.every((e) => e.attributedTo.length > 0)).toBe(true);
    expect(profile.events.some((e) => e.attributedTo === "participant")).toBe(false);
    expect(profile.limitations.some((l) => /not a complexity/i.test(l))).toBe(true);
    expect(profile.listAlternative.length).toBe(profile.events.length);
  });
});

describe("Outcome verification", () => {
  beforeEach(() => {
    clearShadowOutcomes();
  });

  it("defaults to participant_goal_not_yet_verified after preflight", () => {
    const outcome = recordJourneyOutcome({
      query: taylorRoom312Query(),
      requirementSetRef: "fixture:taylor-harbour-v1",
    });

    expect(outcome.outcomeState).toBe("participant_goal_not_yet_verified");
    expect(outcome.distinctions.routeFound).toBe(true);
    expect(outcome.distinctions.requestCreated).toBe(false);
    expect(outcome.distinctions.serviceConfirmed).toBe(false);
    expect(outcome.distinctions.participantGoalAchieved).toBe(false);
    expect(outcome.limitations.some((l) => /not a journey completed/i.test(l))).toBe(true);
  });
});
