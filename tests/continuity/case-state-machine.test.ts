import { describe, expect, it } from "vitest";

import {
  canTransitionContinuityCase,
  CONTINUITY_CASE_TRANSITIONS,
  isTerminalContinuityCase,
} from "@/lib/continuity/cases/case-service";

describe("continuity case state machine", () => {
  it("open -> triage is legal", () => {
    expect(canTransitionContinuityCase("open", "triage")).toBe(true);
  });

  it("planning -> in_recovery is legal", () => {
    expect(canTransitionContinuityCase("planning", "in_recovery")).toBe(true);
  });

  it("closed is terminal", () => {
    expect(isTerminalContinuityCase("closed")).toBe(true);
    expect(CONTINUITY_CASE_TRANSITIONS.closed.length).toBe(0);
  });

  it("resolved is terminal in the sense that only close follows", () => {
    expect(CONTINUITY_CASE_TRANSITIONS.resolved).toEqual(["closed"]);
  });

  it("cannot resurrect from closed", () => {
    expect(canTransitionContinuityCase("closed", "open")).toBe(false);
  });

  it("cannot jump from open to resolved directly", () => {
    expect(canTransitionContinuityCase("open", "resolved")).toBe(false);
  });

  it("cannot jump from open to executing (that state does not exist for cases)", () => {
    // executing is not a case status; the guard should return false.
    // @ts-expect-error deliberate
    expect(canTransitionContinuityCase("open", "executing")).toBe(false);
  });
});
