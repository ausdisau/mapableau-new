import { describe, expect, it } from "vitest";

import {
  AUTO_ABANDON_INACTIVITY_HOURS,
  evaluateGoalTransition,
  isProhibitedAutoGoal,
  type GoalDraft,
} from "@/lib/aura/goals/clarification";

function draft(overrides: Partial<GoalDraft> = {}): GoalDraft {
  const now = new Date("2026-07-16T00:00:00Z");
  return {
    id: "g1",
    participantId: "p1",
    title: "Try new transport option",
    summary: "Explore options",
    source: "participant",
    status: "draft",
    clarifications: [],
    lastParticipantSignalAt: now,
    createdAt: now,
    ...overrides,
  };
}

describe("evaluateGoalTransition", () => {
  it("silence does not count as confirmation for system-suggested goals", () => {
    const goal = draft({ source: "system_suggested" });
    const result = evaluateGoalTransition({
      goal,
      now: new Date("2026-07-16T01:00:00Z"),
      participantConfirmed: false,
    });
    expect(result.next).toBeNull();
    expect(result.reason).toBe("system_suggested_needs_explicit_confirmation");
  });

  it("abandons after inactivity threshold", () => {
    const goal = draft({
      lastParticipantSignalAt: new Date("2026-07-10T00:00:00Z"),
    });
    const later = new Date(
      "2026-07-10T00:00:00Z"
    );
    later.setHours(later.getHours() + AUTO_ABANDON_INACTIVITY_HOURS + 1);
    const result = evaluateGoalTransition({
      goal,
      now: later,
    });
    expect(result.next).toBe("abandoned");
  });

  it("moves to declined when participant declines", () => {
    const goal = draft();
    const result = evaluateGoalTransition({
      goal,
      now: new Date("2026-07-16T00:00:01Z"),
      participantDeclined: true,
    });
    expect(result.next).toBe("declined");
  });

  it("stays in clarifying until answers received", () => {
    const goal = draft({
      clarifications: [
        { prompt: "when?", answeredAt: null, answer: null },
        { prompt: "who?", answeredAt: null, answer: null },
      ],
    });
    const result = evaluateGoalTransition({
      goal,
      now: new Date("2026-07-16T00:10:00Z"),
    });
    expect(result.next).toBe("clarifying");
  });

  it("declines to move a system suggested goal to ready without explicit confirmation", () => {
    const goal = draft({
      source: "system_suggested",
      clarifications: [
        {
          prompt: "ok?",
          answeredAt: new Date("2026-07-16T00:05:00Z"),
          answer: "yes",
        },
      ],
    });
    const result = evaluateGoalTransition({
      goal,
      now: new Date("2026-07-16T00:10:00Z"),
      participantConfirmed: false,
    });
    expect(result.next).toBeNull();
    expect(result.reason).toBe(
      "system_suggested_needs_explicit_confirmation"
    );
  });

  it("isProhibitedAutoGoal blocks consent_change topics", () => {
    expect(isProhibitedAutoGoal("Please handle a consent_change for me")).toBe(true);
    expect(isProhibitedAutoGoal("Look for a support worker")).toBe(false);
  });
});
