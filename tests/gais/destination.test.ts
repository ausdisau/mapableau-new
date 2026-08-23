import { describe, expect, it } from "vitest";
import type {
  AccessPlace,
  AccessPlaceFeature,
  AccessPlaceLocation,
} from "@prisma/client";

import {
  arrivalKindFromFeatureTag,
  mapPlaceFeatureToArrivalFeature,
  resolveDestinationFromPlace,
} from "@/lib/gais/destination";
import { mapableGaisFlags } from "@/lib/config/mapable-gais";

function makePlace(
  overrides: Partial<AccessPlace> & {
    location?: AccessPlaceLocation | null;
    features?: AccessPlaceFeature[];
  } = {},
): AccessPlace & {
  location: AccessPlaceLocation | null;
  features: AccessPlaceFeature[];
} {
  const { location, features, ...placeOverrides } = overrides;
  return {
    id: "place-1",
    name: "Royal North Shore Hospital",
    category: "health",
    description: null,
    addressText: "Reserve Rd",
    suburb: "St Leonards",
    stateOrRegion: "NSW",
    country: "AU",
    status: "published",
    sourceType: "venue",
    sourceReference: null,
    confidence: "venue_claimed",
    createdById: null,
    createdAt: new Date("2026-01-01"),
    updatedAt: new Date("2026-08-01"),
    location:
      location === undefined
        ? ({
            id: "loc-1",
            placeId: "place-1",
            latitude: -33.82,
            longitude: 151.19,
            geohash: null,
          } as AccessPlaceLocation)
        : location,
    features: features ?? [],
    ...placeOverrides,
  };
}

function makeFeature(
  type: AccessPlaceFeature["type"],
  notes?: string | null,
): AccessPlaceFeature {
  return {
    id: `feat-${type}`,
    placeId: "place-1",
    type,
    notes: notes ?? null,
  };
}

describe("Access Destination Resolution", () => {
  it("resolves place + centrePoint from AccessPlace", () => {
    const result = resolveDestinationFromPlace(makePlace());
    expect(result.place.name).toBe("Royal North Shore Hospital");
    expect(result.centrePoint).toEqual({
      type: "Point",
      coordinates: [151.19, -33.82],
    });
    expect(result.meta.fabricatedCoordinates).toBe(false);
    expect(result.meta.indoorNavigation).toBe(false);
  });

  it("never invents entrance coordinates from place centre", () => {
    const result = resolveDestinationFromPlace(
      makePlace({
        features: [makeFeature("step_free_entry", "Recorded on northern side")],
      }),
    );

    const accessible = result.knownEntrances.find(
      (e) => e.accessFeatureTag === "step_free_entry",
    );
    expect(accessible).toBeTruthy();
    expect(accessible?.geometry).toBeNull();
    expect(accessible?.description).toBe("Recorded on northern side");
    expect(accessible?.unknowns).toContain("geometry");
    expect(result.unknowns).toContain("entranceCoordinates");
  });

  it("lists drop-off tags without fabricating coordinates", () => {
    const result = resolveDestinationFromPlace(
      makePlace({ features: [makeFeature("accessible_dropoff")] }),
    );
    expect(result.knownDropOffPoints).toHaveLength(1);
    expect(result.knownDropOffPoints[0].geometry).toBeNull();
    expect(result.unknowns).toContain("dropOffCoordinates");
  });

  it("main entrance always reports unknown accessibility evidence", () => {
    const result = resolveDestinationFromPlace(makePlace());
    const main = result.knownEntrances.find((e) => e.kind === "MAIN_ENTRANCE");
    expect(main).toBeTruthy();
    expect(main?.unknowns).toContain("accessibilityEvidence");
    expect(main?.geometry).toBeNull();
  });

  it("preserves venue-supplied evidence label without claiming measurements", () => {
    const feature = mapPlaceFeatureToArrivalFeature(
      makePlace(),
      makeFeature("step_free_entry", "Northern side"),
    );
    expect(feature?.evidence[0]?.sourceType).toBe("PROVIDER_OR_VENUE_DECLARED");
    expect(feature?.unknowns).toContain("accessibilityMeasurements");
  });

  it("marks centrePoint unknown when location missing", () => {
    const result = resolveDestinationFromPlace(makePlace({ location: null }));
    expect(result.centrePoint).toBeNull();
    expect(result.unknowns).toContain("centrePoint");
  });

  it("always includes indoorPaths as unknown", () => {
    const result = resolveDestinationFromPlace(makePlace());
    expect(result.unknowns).toContain("indoorPaths");
  });

  it("maps arrival kinds without speculative geometry types", () => {
    expect(arrivalKindFromFeatureTag("step_free_entry")).toBe("ENTRANCE");
    expect(arrivalKindFromFeatureTag("accessible_dropoff")).toBe("DROP_OFF");
    expect(arrivalKindFromFeatureTag("lift_access")).toBe("LIFT");
    expect(arrivalKindFromFeatureTag("hearing_loop")).toBeNull();
  });

  it("destination flag defaults off", () => {
    expect(mapableGaisFlags.destinationEnabled).toBe(false);
  });
});
