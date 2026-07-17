import { describe, expect, it } from "vitest";

import {
  isOnlineSelfUpdateAllowed,
  summariseOutcomes,
} from "@/lib/aura/outcomes/calibration";

describe("outcome calibration", () => {
  it("decline is treated separately from failure", () => {
    const summary = summariseOutcomes([
      { executionId: "e1", signal: "declined_by_participant" },
      { executionId: "e2", signal: "failure" },
    ]);
    expect(summary.declinedByParticipant).toBe(1);
    expect(summary.failure).toBe(1);
    expect(summary.successRate).toBe(0);
    expect(summary.declineRate).toBeCloseTo(0.5, 2);
  });

  it("counts success rate correctly", () => {
    const summary = summariseOutcomes([
      { executionId: "e1", signal: "confirmed_success" },
      { executionId: "e2", signal: "confirmed_success" },
      { executionId: "e3", signal: "partial_success" },
      { executionId: "e4", signal: "declined_by_participant" },
    ]);
    expect(summary.successRate).toBeCloseTo(0.75, 2);
  });

  it("no online self-update from outcomes", () => {
    expect(isOnlineSelfUpdateAllowed()).toBe(false);
  });
});
