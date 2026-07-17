import { describe, expect, it } from "vitest";

import {
  assertCanTransitionPilotStatus,
  canTransitionPilotStatus,
  isPilotOperationallyActive,
} from "@/lib/pilot/policy/pilot-status";

describe("pilot status transitions", () => {
  it("allows draft -> pending_decision -> approved -> active", () => {
    expect(canTransitionPilotStatus("draft", "pending_decision")).toBe(true);
    expect(canTransitionPilotStatus("pending_decision", "approved")).toBe(true);
    expect(canTransitionPilotStatus("approved", "active")).toBe(true);
    expect(isPilotOperationallyActive("active")).toBe(true);
  });

  it("allows active -> paused -> active", () => {
    expect(canTransitionPilotStatus("active", "paused")).toBe(true);
    expect(canTransitionPilotStatus("paused", "active")).toBe(true);
  });

  it("denies closed -> active and asserts", () => {
    expect(canTransitionPilotStatus("closed", "active")).toBe(false);
    expect(() => assertCanTransitionPilotStatus("closed", "active")).toThrow(
      /PILOT_STATUS_TRANSITION_DENIED/
    );
  });
});
