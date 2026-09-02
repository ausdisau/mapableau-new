import { describe, expect, it } from "vitest";

import {
  applyJourneyOverride,
  resolveActiveRequirements,
  setSavedRequirements,
} from "@/lib/access/experience/exploration-state";
import {
  buildExplorationResultIds,
  listPresentationIds,
  mapPresentationIds,
  orderPlacesByResultIds,
} from "@/lib/access/experience/exploration-results";
import { accessExperienceFlags } from "@/lib/access/experience/flags";
import { accessibilityProfileToRequirements } from "@/lib/access/experience/requirement-profile";
import { createDefaultExplorationState } from "@/lib/access/experience/exploration-state";
import { DEFAULT_ACCESS_REQUIREMENT_PROFILE } from "@/lib/access/experience/types";
import {
  calculateAccessFitV2,
  shouldIncludePlaceForUnknownHandling,
} from "@/lib/access/fit/calculate-access-fit-v2";
import { DEMO_ACCESS_PLACES } from "@/lib/demo/accessibility-places";

describe("access experience flags", () => {
  it("is fail-closed by default", () => {
    delete process.env.MAPABLE_ACCESS_EXPERIENCE_V2_ENABLED;
    expect(accessExperienceFlags.enabled).toBe(false);
  });

  it("enables only when explicitly true", () => {
    process.env.MAPABLE_ACCESS_EXPERIENCE_V2_ENABLED = "true";
    expect(accessExperienceFlags.enabled).toBe(true);
    delete process.env.MAPABLE_ACCESS_EXPERIENCE_V2_ENABLED;
  });
});

describe("journey overrides", () => {
  it("does not mutate saved requirements when applying journey override", () => {
    const saved = {
      ...DEFAULT_ACCESS_REQUIREMENT_PROFILE,
      stepFreeRequired: true,
      wheelchairUser: true,
    };
    let state = setSavedRequirements(createDefaultExplorationState(), saved);
    state = applyJourneyOverride(state, {
      ...saved,
      accessibleToiletRequired: true,
    });

    expect(state.savedRequirements?.accessibleToiletRequired).toBe(false);
    expect(state.journeyOverride?.accessibleToiletRequired).toBe(true);
    expect(resolveActiveRequirements(state).accessibleToiletRequired).toBe(true);
  });
});

describe("functional requirements projection", () => {
  it("maps mobility aids without diagnosis fields", () => {
    const profile = accessibilityProfileToRequirements({
      mobilityNeeds: ["manual_wheelchair"],
      communicationPreferences: ["auslan"],
      transportRequirements: { requiresRamp: true },
    });
    expect(profile.wheelchairUser).toBe(true);
    expect(profile.stepFreeRequired).toBe(true);
    expect(profile.AuslanNeeded).toBe(true);
    expect(profile).not.toHaveProperty("diagnosis");
  });
});

describe("calculateAccessFitV2", () => {
  const strong = DEMO_ACCESS_PLACES[0]!.profile;

  it("preserves UNKNOWN for null evidence", () => {
    const result = calculateAccessFitV2(
      {
        ...DEFAULT_ACCESS_REQUIREMENT_PROFILE,
        accessibleToiletRequired: true,
      },
      { ...strong, accessibleToilet: null },
    );
    const toilet = result.requirements.find((r) => r.requirementId === "accessible_toilet");
    expect(toilet?.state).toBe("UNKNOWN");
  });

  it("never converts unknown to DOES_NOT_MATCH without false evidence", () => {
    const result = calculateAccessFitV2(
      {
        ...DEFAULT_ACCESS_REQUIREMENT_PROFILE,
        stepFreeRequired: true,
      },
      { ...strong, stepFreeEntry: null },
    );
    const step = result.requirements.find((r) => r.requirementId === "step_free_entry");
    expect(step?.state).toBe("UNKNOWN");
  });

  it("reports MEETS and DOES_NOT_MATCH distinctly", () => {
    const result = calculateAccessFitV2(
      {
        ...DEFAULT_ACCESS_REQUIREMENT_PROFILE,
        stepFreeRequired: true,
        accessibleToiletRequired: true,
      },
      { ...strong, stepFreeEntry: true, accessibleToilet: false },
    );
    expect(result.metCount).toBeGreaterThan(0);
    expect(result.unmetCount).toBeGreaterThan(0);
  });
});

describe("MAP/LIST parity", () => {
  const requirements = {
    ...DEFAULT_ACCESS_REQUIREMENT_PROFILE,
    stepFreeRequired: true,
  };

  it("uses identical ordered result IDs for map and list prefixes", () => {
    const resultIds = buildExplorationResultIds(DEMO_ACCESS_PLACES, requirements, "SHOW");
    const mapIds = mapPresentationIds(resultIds);
    const listIds = listPresentationIds(resultIds, 80);
    expect(mapIds).toEqual(resultIds.slice(0, mapIds.length));
    expect(listIds).toEqual(resultIds.slice(0, listIds.length));
    expect(new Set(mapIds).size).toBe(mapIds.length);
  });

  it("preserves selection ordering when re-slicing", () => {
    const resultIds = buildExplorationResultIds(DEMO_ACCESS_PLACES, requirements, "SHOW");
    const ordered = orderPlacesByResultIds(DEMO_ACCESS_PLACES, resultIds);
    expect(ordered.map((p) => p.id)).toEqual(resultIds);
  });

  it("can avoid unknown-heavy places when configured", () => {
    const unknownHeavy = calculateAccessFitV2(requirements, {
      ...DEMO_ACCESS_PLACES[0]!.profile,
      stepFreeEntry: null,
      internalStepFree: null,
      accessibleToilet: null,
      doorWidthMm: null,
    });
    expect(
      shouldIncludePlaceForUnknownHandling(unknownHeavy, "AVOID_WHEN_POSSIBLE"),
    ).toBe(false);
  });
});
