import { afterEach, describe, expect, it } from "vitest";

import {
  assertPathwayAllowsEvidenceType,
  contributionMustNotAffectConfidence,
  validateMapperDraft,
} from "@/lib/access-intelligence/mapper-kit";

afterEach(() => {
  delete process.env.ACCESS_INTELLIGENCE_CONTRIBUTOR_PATHWAY;
});

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

  it("enforces contributor pathway evidence-type gates", () => {
    process.env.ACCESS_INTELLIGENCE_CONTRIBUTOR_PATHWAY = "true";
    expect(() =>
      assertPathwayAllowsEvidenceType("new_contributor", "measurement"),
    ).toThrow(/cannot submit/);
    expect(() =>
      assertPathwayAllowsEvidenceType(
        "new_contributor",
        "community_observation",
      ),
    ).not.toThrow();
  });
});
