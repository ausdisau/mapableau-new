import { describe, expect, it } from "vitest";

import {
  isParticipantProfileComplete,
  participantProfileEditPath,
  postLoginPathForRole,
} from "@/lib/workers/profile-completion";

describe("participant profile completion", () => {
  it("is incomplete without preferred name or home suburb", () => {
    expect(
      isParticipantProfileComplete({
        preferredName: null,
        homeSuburb: null,
      })
    ).toBe(false);
  });

  it("is complete with either preferred name or suburb", () => {
    expect(
      isParticipantProfileComplete({
        preferredName: "Sam",
        homeSuburb: null,
      })
    ).toBe(true);
    expect(
      isParticipantProfileComplete({
        preferredName: null,
        homeSuburb: "Brisbane",
      })
    ).toBe(true);
  });

  it("routes incomplete participants to profile edit", () => {
    expect(
      postLoginPathForRole("participant", null, {
        preferredName: null,
        homeSuburb: null,
      })
    ).toBe(participantProfileEditPath());
  });
});
