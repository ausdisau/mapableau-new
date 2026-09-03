import { describe, expect, it } from "vitest";

import {
  applyJourneyOverride,
  resolveActiveRequirements,
  setSavedRequirements,
} from "@/lib/access/experience/exploration-state";
import {
  buildExplorationResultIds,
  buildExplorationResultIdsFromDemoPlaces,
  explorationDtoToFitSource,
  listPresentationIds,
  mapCoordinateIds,
  mapPresentationIds,
  orderPlacesByResultIds,
} from "@/lib/access/experience/exploration-results";
import { accessExperienceFlags } from "@/lib/access/experience/flags";
import { accessibilityProfileToRequirements } from "@/lib/access/experience/requirement-profile";
import { createDefaultExplorationState } from "@/lib/access/experience/exploration-state";
import { projectAccessPlaceToExplorationDto } from "@/lib/access/experience/project-access-place";
import {
  accessToGoHref,
  buildAccessToGoHandoff,
} from "@/lib/access/experience/access-route-handoff";
import { DEFAULT_ACCESS_REQUIREMENT_PROFILE } from "@/lib/access/experience/types";
import {
  calculateAccessFitV2,
  shouldIncludePlaceForUnknownHandling,
} from "@/lib/access/fit/calculate-access-fit-v2";
import { DEMO_ACCESS_PLACES } from "@/lib/demo/accessibility-places";
import { demoAccessPlaceToExplorationDto } from "@/lib/access/experience/demo-access-place-adapter";

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
    const resultIds = buildExplorationResultIdsFromDemoPlaces(
      DEMO_ACCESS_PLACES,
      requirements,
      "SHOW",
    );
    const mapIds = mapPresentationIds(resultIds);
    const listIds = listPresentationIds(resultIds, 80);
    expect(mapIds).toEqual(resultIds.slice(0, mapIds.length));
    expect(listIds).toEqual(resultIds.slice(0, listIds.length));
    expect(new Set(mapIds).size).toBe(mapIds.length);
  });

  it("preserves selection ordering when re-slicing", () => {
    const resultIds = buildExplorationResultIdsFromDemoPlaces(
      DEMO_ACCESS_PLACES,
      requirements,
      "SHOW",
    );
    const ordered = orderPlacesByResultIds(DEMO_ACCESS_PLACES, resultIds);
    expect(ordered.map((p) => p.id)).toEqual(resultIds);
  });

  it("keeps places without coordinates in list IDs but omits them from map markers", () => {
    const dtos = DEMO_ACCESS_PLACES.map(demoAccessPlaceToExplorationDto);
    const withoutCoords = {
      ...dtos[0]!,
      accessPlaceId: "list-only-place",
      hasCoordinates: false,
      latitude: null,
      longitude: null,
    };
    const places = [...dtos, withoutCoords];
    const resultIds = buildExplorationResultIds(
      places.map(explorationDtoToFitSource),
      requirements,
      "SHOW",
    );
    expect(resultIds).toContain("list-only-place");
    const mapIds = mapCoordinateIds(
      resultIds,
      places.map((p) => ({
        id: p.accessPlaceId,
        hasCoordinates: p.hasCoordinates,
        latitude: p.latitude,
        longitude: p.longitude,
      })),
    );
    expect(mapIds).not.toContain("list-only-place");
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

describe("AccessPlace exploration projection", () => {
  it("projects AccessPlace without leaking Prisma or diagnosis fields", () => {
    const dto = projectAccessPlaceToExplorationDto({
      id: "place-1",
      name: "Community Hub",
      category: "community_centre",
      suburb: "Parramatta",
      stateOrRegion: "NSW",
      addressText: "1 Civic Pl",
      confidence: "high",
      location: { latitude: -33.81, longitude: 151.0 },
      features: [{ type: "step_free_entry" }, { type: "accessible_toilet" }],
      reviewCount: 3,
    });

    expect(dto.accessPlaceId).toBe("place-1");
    expect(dto.hasCoordinates).toBe(true);
    expect(dto.placeProfile.stepFreeEntry).toBe(true);
    expect(dto.capabilityFacts.liftPresent).toBeNull();
    expect(JSON.stringify(dto)).not.toMatch(/prisma|diagnosis|password|email/i);
  });

  it("marks missing coordinates without dropping the place", () => {
    const dto = projectAccessPlaceToExplorationDto({
      id: "place-2",
      name: "Library desk",
      category: "library",
      features: [],
    });
    expect(dto.hasCoordinates).toBe(false);
    expect(dto.latitude).toBeNull();
    expect(dto.longitude).toBeNull();
  });
});

describe("AccessFit extended facts stay UNKNOWN without evidence", () => {
  it("returns UNKNOWN for lift/path/gradient requirements when facts are null", () => {
    const result = calculateAccessFitV2(
      {
        ...DEFAULT_ACCESS_REQUIREMENT_PROFILE,
        liftRequired: true,
        minimumPathWidthMm: 900,
        maximumPreferredGradientPercent: 5,
        kerbRampRequired: true,
        changingPlacesPreferred: true,
        captioningPreferred: true,
      },
      {
        ...DEMO_ACCESS_PLACES[0]!.profile,
        liftPresent: null,
        pathWidthMm: null,
        maxGradientPercent: null,
        kerbRampPresent: null,
        changingPlacesPresent: null,
        captioningAvailable: null,
      },
    );
    const byId = Object.fromEntries(result.requirements.map((r) => [r.requirementId, r.state]));
    expect(byId.lift).toBe("UNKNOWN");
    expect(byId.path_width).toBe("UNKNOWN");
    expect(byId.gradient).toBe("UNKNOWN");
    expect(byId.kerb_ramp).toBe("UNKNOWN");
    expect(byId.changing_places).toBe("UNKNOWN");
    expect(byId.captioning).toBe("UNKNOWN");
  });
});

describe("Access → Go handoff", () => {
  it("passes only mobility routing prefs and sandbox marker", () => {
    const href = accessToGoHref({
      destinationPlaceId: "place-1",
      destinationName: "Community Hub",
      requirements: {
        ...DEFAULT_ACCESS_REQUIREMENT_PROFILE,
        stepFreeRequired: true,
        wheelchairUser: true,
        minimumPathWidthMm: 900,
        maximumPreferredGradientPercent: 5,
        accessibleToiletRequired: true,
      },
      journeyOverrideActive: true,
    });
    expect(href).toContain("/go?");
    expect(href).toContain("destinationPlaceId=place-1");
    expect(href).toContain("sandbox=1");
    expect(href).toContain("stepFreeRequired=1");
    expect(href).toContain("journeyOverride=1");
    expect(href).not.toMatch(/toilet|diagnosis|Auslan|AAC/i);

    const query = buildAccessToGoHandoff({
      destinationPlaceId: "place-1",
      requirements: DEFAULT_ACCESS_REQUIREMENT_PROFILE,
    });
    expect(query.sandbox).toBe("1");
  });
});
