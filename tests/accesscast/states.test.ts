import { describe, expect, it } from "vitest";

import {
  ACCESS_CAST_STATES,
  ACCESS_CAST_STATE_PLAIN_LANGUAGE,
  worseAccessCastState,
} from "@/lib/accesscast";

describe("AccessCast states", () => {
  it("defines all participant-facing states with plain language", () => {
    expect(ACCESS_CAST_STATES).toContain("stable");
    expect(ACCESS_CAST_STATES).toContain("fragile");
    expect(ACCESS_CAST_STATES).toContain("cannot_confirm");
    expect(ACCESS_CAST_STATES).toContain("temporarily_unavailable");
    for (const s of ACCESS_CAST_STATES) {
      expect(ACCESS_CAST_STATE_PLAIN_LANGUAGE[s].length).toBeGreaterThan(20);
    }
  });

  it("ranks temporarily_unavailable worse than stable", () => {
    expect(worseAccessCastState("stable", "temporarily_unavailable")).toBe(
      "temporarily_unavailable",
    );
    expect(worseAccessCastState("fragile", "likely_usable")).toBe("fragile");
  });
});
