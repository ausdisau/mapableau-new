import { describe, expect, it } from "vitest";

import {
  assertSentinelTransition,
  canTransitionSentinelState,
} from "@/lib/ai/platform/sentinel/state-machine";

describe("Sentinel state machine", () => {
  it("allows a deterministic pause from observing", () => {
    expect(canTransitionSentinelState("OBSERVING", "PAUSED")).toBe(true);
  });

  it("does not let an approved action skip postcondition checking", () => {
    expect(
      canTransitionSentinelState("APPROVED_ACTION_PENDING", "RESOLVED"),
    ).toBe(false);
  });

  it("allows participant stop from an active decision state", () => {
    expect(
      canTransitionSentinelState(
        "PARTICIPANT_CONFIRMATION_REQUIRED",
        "STOPPED_BY_PARTICIPANT",
      ),
    ).toBe(true);
  });

  it("throws on an invalid transition", () => {
    expect(() => assertSentinelTransition("PAUSED", "RESOLVED")).toThrow(
      "SENTINEL_INVALID_STATE_TRANSITION",
    );
  });
});
