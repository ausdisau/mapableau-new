import { describe, expect, it } from "vitest";

import {
  createMissionStateMachine,
  evaluateMissionBlockers,
  hashMissionWriteProposal,
} from "@/lib/access-intelligence/missions";

describe("System 8 mission console", () => {
  it("enforces mission state transitions", () => {
    const sm = createMissionStateMachine("draft");
    expect(sm.canTransitionTo("awaiting_participant_input")).toBe(true);
    expect(() => sm.transition("completed")).toThrow();
  });

  it("requires approval hashes for writes", () => {
    const hash = hashMissionWriteProposal({ bookingId: "b1" });
    expect(hash).toHaveLength(32);
  });

  it("evaluates blockers and readiness", () => {
    const ready = evaluateMissionBlockers({
      dependencies: [{ status: "resolved", summary: "Transport" }],
      unknowns: [],
      timingConflicts: [],
    });
    expect(ready.readyForReview).toBe(true);
  });
});
