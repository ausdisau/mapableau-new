import { describe, expect, it } from "vitest";

import { calculateAccessFit } from "@/lib/access-fit/calculate-access-fit";
import { hasActiveAccessNeeds } from "@/lib/access-fit/has-active-access-needs";
import {
  DEMO_ACCESS_NEEDS,
  EMPTY_ACCESS_NEEDS,
  type AccessNeed,
  type PlaceAccessProfile,
} from "@/lib/access-fit/types";
import { DEMO_ACCESS_PLACES } from "@/lib/demo/accessibility-places";

const incompleteProfile: PlaceAccessProfile = {
  stepFreeEntry: null,
  doorWidthMm: null,
  internalStepFree: null,
  accessibleToilet: null,
  accessibleParking: null,
  dropOffPoint: null,
  lowSensoryOption: null,
  hearingLoop: null,
  staffTraining: null,
  assistanceAnimalWelcome: null,
  publicTransportNearby: null,
  transportBookable: null,
  lastVerified: null,
  confidence: "unknown",
};

describe("hasActiveAccessNeeds", () => {
  it("is false when no needs are selected", () => {
    expect(hasActiveAccessNeeds(EMPTY_ACCESS_NEEDS)).toBe(false);
  });

  it("is true when one need is selected", () => {
    const oneNeed: AccessNeed = { ...EMPTY_ACCESS_NEEDS, stepFreeRequired: true };
    expect(hasActiveAccessNeeds(oneNeed)).toBe(true);
  });

  it("is true for the demo wheelchair profile", () => {
    expect(hasActiveAccessNeeds(DEMO_ACCESS_NEEDS)).toBe(true);
  });
});

describe("Access-Fit preference gating", () => {
  it("returns unknown/zero when no needs are selected (do not treat as failed fit in UI)", () => {
    const result = calculateAccessFit(EMPTY_ACCESS_NEEDS, incompleteProfile);
    expect(result.label).toBe("unknown");
    expect(result.score).toBe(0);
    expect(hasActiveAccessNeeds(EMPTY_ACCESS_NEEDS)).toBe(false);
  });

  it("calculates when one need is selected even with incomplete venue evidence", () => {
    const oneNeed: AccessNeed = { ...EMPTY_ACCESS_NEEDS, accessibleToiletRequired: true };
    const result = calculateAccessFit(oneNeed, incompleteProfile);
    expect(hasActiveAccessNeeds(oneNeed)).toBe(true);
    expect(result.unknowns.length).toBeGreaterThan(0);
    expect(result.label).not.toBe("strong fit");
  });

  it("calculates for demo profile against a demo place", () => {
    const place = DEMO_ACCESS_PLACES[0];
    const result = calculateAccessFit(DEMO_ACCESS_NEEDS, place.profile);
    expect(result.score).toBeGreaterThan(0);
    expect(["strong fit", "possible fit", "needs confirmation", "likely barrier", "unknown"]).toContain(
      result.label,
    );
  });
});
