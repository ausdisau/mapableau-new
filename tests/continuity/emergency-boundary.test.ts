import { describe, expect, it } from "vitest";

import {
  assertNotEmergencyAction,
  assertNarrativeDoesNotClaimEmergencyAction,
  containsEmergencyKeyword,
  EMERGENCY_ACTION_SLUGS,
  EmergencyBoundaryError,
} from "@/lib/aura/safety/emergency-boundary";

describe("emergency boundary", () => {
  it("blocks known emergency action slugs", () => {
    for (const slug of EMERGENCY_ACTION_SLUGS) {
      expect(() => assertNotEmergencyAction(slug)).toThrow(EmergencyBoundaryError);
    }
  });

  it("allows non-emergency slugs", () => {
    expect(() => assertNotEmergencyAction("continuity.draft_recovery_plan")).not.toThrow();
    expect(() => assertNotEmergencyAction("care.search_options")).not.toThrow();
  });

  it("detects emergency keywords in a narrative", () => {
    expect(containsEmergencyKeyword("we will call 000 immediately")).toBe(true);
    expect(containsEmergencyKeyword("please contact the ambulance")).toBe(true);
    expect(containsEmergencyKeyword("triple zero")).toBe(true);
    expect(containsEmergencyKeyword("nothing dangerous here")).toBe(false);
    expect(containsEmergencyKeyword(undefined)).toBe(false);
  });

  it("throws when narrative claims an emergency action", () => {
    expect(() =>
      assertNarrativeDoesNotClaimEmergencyAction("Plan step 1: will call 000 for the participant.")
    ).toThrow(EmergencyBoundaryError);
    expect(() =>
      assertNarrativeDoesNotClaimEmergencyAction("The coordinator shall contact ambulance.")
    ).toThrow(EmergencyBoundaryError);
  });

  it("does not throw for benign narratives", () => {
    expect(() =>
      assertNarrativeDoesNotClaimEmergencyAction("Draft an SMS to the participant explaining the reschedule.")
    ).not.toThrow();
  });
});
