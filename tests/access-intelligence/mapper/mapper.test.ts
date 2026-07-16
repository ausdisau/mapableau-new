import { describe, expect, it } from "vitest";

import {
  contributionMustNotAffectConfidence,
  validateMapperDraft,
} from "@/lib/access-intelligence/mapper-kit";

describe("System 4 mapper kit", () => {
  it("does not let points change confidence", () => {
    expect(
      contributionMustNotAffectConfidence({
        baseConfidence: 0.55,
        contributionPoints: 999,
        badges: 12,
      }),
    ).toBe(0.55);
  });

  it("requires image consent for photographs", () => {
    const result = validateMapperDraft(
      "trained_mapper",
      {
        elementType: "door",
        observedVsEstimated: "observed",
        imageConsent: false,
      },
      "photograph",
    );
    expect(result.ok).toBe(false);
  });
});
