import { describe, expect, it } from "vitest";

import type { AccessExplorationDto } from "@/lib/access/experience/access-exploration-dto";
import { filterPlacesToGccsaRegion } from "@/lib/access/regions/filter-access-places";
import {
  normalizeAbsGccsaGeoJson,
  type GccsaBoundaryFeatureCollection,
} from "@/lib/access/regions/gccsa";
import { pointIsInGccsaRegion } from "@/lib/access/regions/point-in-geometry";

const boundary: GccsaBoundaryFeatureCollection = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [150, -35],
            [152, -35],
            [152, -33],
            [150, -33],
            [150, -35],
          ],
        ],
      },
      properties: {
        mapableSlug: "sydney",
        gccsaCode: "1GSYD",
        gccsaName: "Greater Sydney",
        stateName: "New South Wales",
        areaSqKm: null,
        source: "abs_asgs_2026",
      },
    },
  ],
};

describe("national Access GCCSA boundaries", () => {
  it("normalises the eight-city ABS field contract without inventing geometry", () => {
    const normalized = normalizeAbsGccsaGeoJson({
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          geometry: boundary.features[0].geometry,
          properties: {
            GCCSA_CODE_2026: "1GSYD",
            GCCSA_NAME_2026: "Greater Sydney",
            STATE_NAME_2026: "New South Wales",
          },
        },
        {
          type: "Feature",
          geometry: {
            type: "Point",
            coordinates: [151, -34],
          },
          properties: {
            GCCSA_CODE_2026: "1GSYD",
            GCCSA_NAME_2026: "Greater Sydney",
          },
        },
      ],
    });

    expect(normalized.features).toHaveLength(1);
    expect(normalized.features[0]?.properties.mapableSlug).toBe("sydney");
  });

  it("tests canonical AccessPlace coordinates against the selected GCCSA", () => {
    expect(
      pointIsInGccsaRegion({
        latitude: -34,
        longitude: 151,
        slug: "sydney",
        boundary,
      }),
    ).toBe(true);

    expect(
      pointIsInGccsaRegion({
        latitude: -37.8,
        longitude: 144.9,
        slug: "sydney",
        boundary,
      }),
    ).toBe(false);
  });

  it("keeps unclassifiable places honest when region filtering is active", () => {
    const places = [
      {
        accessPlaceId: "inside",
        name: "Inside",
        category: "COMMUNITY",
        suburb: "Sydney",
        stateOrRegion: "NSW",
        addressText: null,
        hasCoordinates: true,
        latitude: -34,
        longitude: 151,
      },
      {
        accessPlaceId: "unknown-location",
        name: "Unknown location",
        category: "COMMUNITY",
        suburb: null,
        stateOrRegion: "NSW",
        addressText: null,
        hasCoordinates: false,
        latitude: null,
        longitude: null,
      },
    ] as unknown as AccessExplorationDto[];

    const result = filterPlacesToGccsaRegion({
      places,
      region: "sydney",
      boundary,
    });

    expect(result.boundaryApplied).toBe(true);
    expect(result.places.map((place) => place.accessPlaceId)).toEqual(["inside"]);
    expect(result.unclassifiedCount).toBe(1);
  });

  it("does not fake a region filter if the boundary is unavailable", () => {
    const places = [
      {
        accessPlaceId: "one",
        hasCoordinates: true,
        latitude: -34,
        longitude: 151,
      },
    ] as unknown as AccessExplorationDto[];

    const result = filterPlacesToGccsaRegion({
      places,
      region: "sydney",
      boundary: null,
    });

    expect(result.boundaryApplied).toBe(false);
    expect(result.places).toBe(places);
  });
});
