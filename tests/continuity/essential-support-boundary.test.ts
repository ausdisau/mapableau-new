import { describe, expect, it } from "vitest";

import { assertEssentialSourceIsHumanDefined } from "@/lib/continuity/profile/profile-service";

describe("essential support boundary", () => {
  it("accepts participant-declared source", () => {
    expect(() => assertEssentialSourceIsHumanDefined({ origin: "participant_profile" })).not.toThrow();
  });

  it("accepts authorised-delegate-declared source", () => {
    expect(() =>
      assertEssentialSourceIsHumanDefined({ origin: "authorised_delegate_update" })
    ).not.toThrow();
  });

  it("accepts coordinator-note-confirmed-with-participant source", () => {
    expect(() =>
      assertEssentialSourceIsHumanDefined({ origin: "coordinator_note_confirmed_with_participant" })
    ).not.toThrow();
  });

  it("refuses diagnosis as an essential-support source", () => {
    expect(() => assertEssentialSourceIsHumanDefined({ origin: "diagnosis" })).toThrow(
      /ESSENTIAL_SUPPORT_SOURCE_NOT_ALLOWED/
    );
  });

  it("refuses plan_category as an essential-support source", () => {
    expect(() => assertEssentialSourceIsHumanDefined({ origin: "plan_category" })).toThrow();
  });

  it("refuses ai_inference as an essential-support source", () => {
    expect(() => assertEssentialSourceIsHumanDefined({ origin: "ai_inference" })).toThrow();
  });
});
