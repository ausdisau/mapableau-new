import { describe, expect, it } from "vitest";

import {
  toAccessExplorationPlace,
  toAccessExplorationPlaceWithGais,
} from "@/lib/access/experience/to-access-exploration-place";
import {
  overlayGaisOnPlaceAccessProfile,
  toGaisPlaceSummaryLike,
} from "@/lib/access/experience/gais-place-summary-adapter";
import { accessPlaceToPlaceAccessProfile } from "@/lib/access/experience/access-place-profile-adapter";
import {
  buildExplorationResultIds,
  buildExplorationResultIdsFromAccessPlaces,
  listPresentationIds,
  mapPresentationIds,
  orderAccessExplorationPlacesByResultIds,
  orderPlacesByResultIds,
} from "@/lib/access/experience/exploration-results";
import {
  applyJourneyOverride,
  createDefaultExplorationState,
  resolveActiveRequirements,
  setSavedRequirements,
} from "@/lib/access/experience/exploration-state";
import { accessExperienceFlags } from "@/lib/access/experience/flags";
import {
  buildGoHandoffHref,
  requirementsToMobilityRoutingProfile,
} from "@/lib/access/experience/go-handoff";
import { accessibilityProfileToRequirements } from "@/lib/access/experience/requirement-profile";
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

  it("maps extended measurement requirements with UNKNOWN when missing", () => {
    const result = calculateAccessFitV2(
      {
        ...DEFAULT_ACCESS_REQUIREMENT_PROFILE,
        minimumPathWidthMm: 1000,
        maximumPreferredGradientPercent: 5,
        kerbRampRequired: true,
        liftRequired: true,
        changingPlacesPreferred: true,
        captioningPreferred: true,
        highContrastSignagePreferred: true,
        tactileCuesPreferred: true,
        surfaceTolerance: "smooth_only",
      },
      {
        ...strong,
        pathWidthMm: null,
        maxGradientPercent: null,
        kerbRamp: null,
        lift: null,
        changingPlaces: null,
        captioning: null,
        highContrastSignage: null,
        tactileCues: null,
        surfaceQuality: null,
      },
    );
    for (const id of [
      "path_width",
      "max_gradient",
      "kerb_ramp",
      "lift",
      "changing_places",
      "captioning",
      "high_contrast_signage",
      "tactile_cues",
      "surface_tolerance",
    ]) {
      expect(result.requirements.find((r) => r.requirementId === id)?.state).toBe(
        "UNKNOWN",
      );
    }
  });

  it("evaluates path width when evidence exists", () => {
    const result = calculateAccessFitV2(
      {
        ...DEFAULT_ACCESS_REQUIREMENT_PROFILE,
        minimumPathWidthMm: 1000,
      },
      { ...strong, pathWidthMm: 1200 },
    );
    expect(result.requirements.find((r) => r.requirementId === "path_width")?.state).toBe(
      "MEETS",
    );
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

describe("AccessExplorationPlace projection", () => {
  it("projects AccessPlace features without inventing false evidence", () => {
    const place = toAccessExplorationPlace({
      id: "place-1",
      name: "Library",
      category: "library",
      confidence: "mapable_verified",
      sourceType: "mapable_assessed",
      updatedAt: "2026-01-01T00:00:00.000Z",
      location: { latitude: -33.8, longitude: 151.0 },
      features: [{ type: "step_free_entry" }, { type: "accessible_toilet" }],
      _count: { reviews: 2 },
    });

    expect(place.placeId).toBe("place-1");
    expect(place.hasCoordinates).toBe(true);
    expect(place.accessProfile.stepFreeEntry).toBe(true);
    expect(place.accessProfile.accessibleToilet).toBe(true);
    expect(place.accessProfile.hearingLoop).toBeNull();
    expect(place.accessProfile.pathWidthMm).toBeNull();
    expect(place.accessProfile.doorWidthMm).toBeNull();
    expect(JSON.stringify(place)).not.toMatch(/diagnosis/i);
  });

  it("keeps places without coordinates list-visible", () => {
    const place = toAccessExplorationPlace({
      id: "no-coords",
      name: "Hall",
      category: "community_centre",
      features: [],
    });
    expect(place.hasCoordinates).toBe(false);
    expect(place.latitude).toBeNull();
  });

  it("shares result IDs between AccessExplorationPlace map/list helpers", () => {
    const places = [
      toAccessExplorationPlace({
        id: "a",
        name: "A",
        category: "library",
        features: [{ type: "step_free_entry" }],
        location: { latitude: 1, longitude: 2 },
      }),
      toAccessExplorationPlace({
        id: "b",
        name: "B",
        category: "library",
        features: [],
      }),
    ];
    const ids = buildExplorationResultIdsFromAccessPlaces(
      places,
      { ...DEFAULT_ACCESS_REQUIREMENT_PROFILE, stepFreeRequired: true },
      "SHOW",
    );
    const ordered = orderAccessExplorationPlacesByResultIds(places, ids);
    expect(ordered.map((p) => p.placeId)).toEqual(ids);
    expect(mapPresentationIds(ids)[0]).toBe(ids[0]);
  });

  it("maps confidence levels without fabricating measurements", () => {
    const profile = accessPlaceToPlaceAccessProfile({
      id: "x",
      name: "X",
      category: "shop",
      confidence: "user_reported",
      features: [{ type: "wide_paths" }, { type: "wide_doorways" }],
    });
    expect(profile.confidence).toBe("low");
    expect(profile.pathWidthMm).toBeNull();
    expect(profile.doorWidthMm).toBeNull();
  });
});

describe("Go handoff", () => {
  it("builds destination handoff without diagnosis fields", () => {
    const href = buildGoHandoffHref({
      destinationPlaceId: "place-99",
      requirements: {
        ...DEFAULT_ACCESS_REQUIREMENT_PROFILE,
        wheelchairUser: true,
        stepFreeRequired: true,
        kerbRampRequired: true,
        minimumPathWidthMm: 1100,
      },
    });
    expect(href).toContain("destinationPlaceId=place-99");
    expect(href).toContain("sandbox=1");
    expect(href).toContain("reviewPreferences=1");
    expect(href).toContain("mobilityAidType=manual_wheelchair");
    expect(href).toContain("curbRampRequired=1");
    expect(href).not.toMatch(/diagnosis/i);
  });

  it("maps only routing-relevant mobility constraints", () => {
    const profile = requirementsToMobilityRoutingProfile({
      ...DEFAULT_ACCESS_REQUIREMENT_PROFILE,
      powerchairUser: true,
      liftRequired: true,
      accessibleToiletRequired: true,
    });
    expect(profile.mobilityAidType).toBe("power_wheelchair");
    expect(profile.liftRequirement).toBe(true);
    expect(profile.accessibleToiletPreference).toBe(true);
    expect(profile).not.toHaveProperty("diagnosis");
  });
});

describe("GAIS place summary adapter", () => {
  it("overlays measurements without inventing missing values", () => {
    const base = accessPlaceToPlaceAccessProfile({
      id: "place-gais",
      name: "Civic",
      category: "civic",
      features: [{ type: "step_free_entry" }],
    });
    expect(base.pathWidthMm).toBeNull();
    expect(base.doorWidthMm).toBeNull();

    const overlaid = overlayGaisOnPlaceAccessProfile(base, {
      placeId: "place-gais",
      name: "Civic",
      category: "civic",
      geometry: { type: "Point", coordinates: [151, -33.8] },
      evidenceScope: "published_access_places",
      features: [
        {
          id: "gais-path-1",
          type: "PATH",
          geometry: { type: "Point", coordinates: [151, -33.8] },
          properties: { widthMm: 1200, accessFeatureTag: "wide_paths" },
          evidence: [
            {
              sourceType: "COMMUNITY_REPORTED",
              sourceLabel: "Community reported",
              observedAt: "2026-02-01T00:00:00.000Z",
            },
          ],
          observedAt: "2026-02-01T00:00:00.000Z",
        },
        {
          id: "gais-lift-1",
          type: "LIFT",
          geometry: { type: "Point", coordinates: [151, -33.8] },
          properties: { liftAvailable: true, accessFeatureTag: "lift_access" },
          evidence: [{ sourceType: "VERIFIED", sourceLabel: "Verified" }],
        },
        {
          id: "gais-entrance-1",
          type: "ENTRANCE",
          geometry: { type: "Point", coordinates: [151, -33.8] },
          properties: {
            // Explicit undefined measurements must stay UNKNOWN
            stepFree: undefined,
            accessFeatureTag: "step_free_entry",
          },
          evidence: [{ sourceType: "UNKNOWN", sourceLabel: "Unknown" }],
        },
      ],
    });

    expect(overlaid.stepFreeEntry).toBe(true);
    expect(overlaid.pathWidthMm).toBe(1200);
    expect(overlaid.lift).toBe(true);
    expect(overlaid.captioning).toBeNull();
    expect(overlaid.highContrastSignage).toBeNull();
    expect(overlaid.maxGradientPercent).toBeNull();
  });

  it("projects GAIS summary into exploration DTO without diagnosis fields", () => {
    const dto = toAccessExplorationPlaceWithGais(
      {
        id: "place-gais-2",
        name: "Gallery",
        category: "museum",
        features: [{ type: "accessible_toilet" }],
        location: { latitude: -33.87, longitude: 151.2 },
      },
      {
        placeId: "place-gais-2",
        name: "Gallery",
        category: "museum",
        geometry: { type: "Point", coordinates: [151.2, -33.87] },
        evidenceScope: "published_access_places_and_community_barriers",
        features: [
          {
            id: "gais-door-1",
            type: "DOOR",
            geometry: { type: "Point", coordinates: [151.2, -33.87] },
            properties: { widthMm: 920, accessFeatureTag: "wide_doorways" },
            evidence: [
              {
                sourceType: "PROVIDER_OR_VENUE_DECLARED",
                sourceLabel: "Venue supplied",
              },
            ],
            observedAt: "2026-03-01T00:00:00.000Z",
          },
        ],
      },
    );

    expect(dto.accessProfile.accessibleToilet).toBe(true);
    expect(dto.accessProfile.doorWidthMm).toBe(920);
    expect(dto.accessProfile.pathWidthMm).toBeNull();
    expect(dto.provenanceSummary).toMatch(/GAIS evidence scope/i);
    expect(dto.freshnessLabel).toMatch(/2026-03-01/);
    expect(JSON.stringify(dto)).not.toMatch(/diagnosis/i);
  });

  it("leaves profile unchanged when GAIS summary is absent", () => {
    const base = accessPlaceToPlaceAccessProfile({
      id: "no-gais",
      name: "Hall",
      category: "community_centre",
      features: [],
    });
    expect(overlayGaisOnPlaceAccessProfile(base, null)).toEqual(base);
    expect(toGaisPlaceSummaryLike(null)).toBeUndefined();
  });
});
