import { describe, expect, it } from "vitest";

import {
  COMMUNITY_AREAS,
  MAX_SOURCE_ELEMENTS,
} from "@/lib/access/community-infrastructure/config";
import {
  normaliseOsmElement,
  normaliseOverpassResponse,
  sourceTags,
} from "@/lib/access/community-infrastructure/normalise";

const area = COMMUNITY_AREAS[0];
const retrievedAt = "2026-11-28T03:00:00.000Z";

function node(
  tags: Record<string, string>,
  extra: Record<string, unknown> = {},
) {
  return {
    type: "node",
    id: 101,
    lat: -33.815,
    lon: 151.005,
    tags,
    ...extra,
  };
}

function first(
  tags: Record<string, string>,
  extra: Record<string, unknown> = {},
) {
  return normaliseOsmElement(node(tags, extra), area, retrievedAt)[0];
}

describe("OSM community infrastructure source semantics", () => {
  it("keeps missing wheelchair facts unknown even on designated parking", () => {
    const feature = first({
      amenity: "parking_space",
      parking_space: "disabled",
    });
    expect(feature.properties.facilityKind).toBe("designated_parking_space");
    expect(feature.properties.wheelchair).toBe("unknown");
    expect(feature.properties.gaisEvidenceState).toBe("COMMUNITY_REPORTED");
    expect(feature.properties.unknownAttributes).toContain("Current vacancy");
    expect(feature.properties.unknownAttributes).toContain(
      "Accessible route connection",
    );
    expect(feature.properties.routeEndpoint).toBe(false);
    expect(feature.properties.facts.stepFree).toBeUndefined();
  });

  it.each(["no", "limited", "yes", "designated"])(
    "preserves explicit wheelchair=%s without upgrading it to verification",
    (wheelchair) => {
      const feature = first({ amenity: "toilets", wheelchair });
      expect(feature.properties.wheelchair).toBe(wheelchair);
      expect(feature.properties.gaisEvidenceState).toBe("COMMUNITY_REPORTED");
      expect(feature.properties.observedAt).toBeUndefined();
    },
  );

  it("does not convert unknown source status or malformed status into no", () => {
    const feature = first({ amenity: "toilets", wheelchair: "probably" });
    expect(feature.properties.wheelchair).toBe("unknown");
    expect(feature.properties.sourceTags.wheelchair).toBe("probably");
  });

  it.each<Record<string, string>>([
    { "capacity:disabled": "0" },
    { disabled: "yes" },
    { "capacity:disabled": "unknown" },
  ])(
    "does not invent parking designation from non-designation metadata %j",
    (extraTags) => {
      const feature = first({ amenity: "parking_space", ...extraTags });
      expect(feature.properties.facilityKind).toBe("parking_space");
      expect(feature.properties.name).toBe(
        "Parking space with disability-access information",
      );
      expect(feature.properties.wheelchair).toBe("unknown");
    },
  );

  it("preserves a zero disabled-space count as reported without implying vacancy", () => {
    const feature = first({ amenity: "parking", "capacity:disabled": "0" });
    expect(feature.properties.sourceTags["capacity:disabled"]).toBe("0");
    expect(feature.properties.accessFacts).toContainEqual({
      key: "capacity:disabled",
      label: "Designated disability spaces reported (not vacancy)",
      value: "0",
    });
  });

  it("keeps venue access distinct from its toilet access", () => {
    const feature = first({
      amenity: "cafe",
      name: "Example venue",
      toilets: "yes",
      wheelchair: "yes",
      opening_hours: "24/7",
      access: "yes",
    });
    expect(feature.properties.wheelchair).toBe("unknown");
    expect(feature.properties.facilityKind).toBe("venue_toilet");
    expect(feature.properties.name).toBe(
      "Example venue — toilets (venue location)",
    );
    expect(
      feature.properties.accessFacts.find((fact) => fact.key === "wheelchair")
        ?.label,
    ).toBe("Venue wheelchair access reported (not toilet-specific)");
    expect(
      feature.properties.accessFacts.find(
        (fact) => fact.key === "opening_hours",
      )?.label,
    ).toBe("Venue opening hours (source text) (not toilet-specific)");
  });

  it("uses the toilet-specific negative even when its venue reports wheelchair access", () => {
    const feature = first({
      amenity: "cafe",
      toilets: "yes",
      wheelchair: "yes",
      "toilets:wheelchair": "no",
    });
    expect(feature.properties.wheelchair).toBe("no");
  });

  it("does not infer adult changing or hoist equipment from a baby table", () => {
    const feature = first({ amenity: "toilets", changing_table: "yes" });
    expect(feature.properties.accessFacts).toContainEqual({
      key: "changing_table",
      label: "Baby changing table reported",
      value: "yes",
    });
    expect(
      feature.properties.sourceTags["changing_table:adult"],
    ).toBeUndefined();
    expect(feature.properties.unknownAttributes).toContain(
      "Hoist availability",
    );
  });

  it("creates separate toilet and public-space projections without losing private access", () => {
    const features = normaliseOsmElement(
      node({
        leisure: "park",
        access: "private",
        toilets: "yes",
        wheelchair: "yes",
        "toilets:wheelchair": "limited",
      }),
      area,
      retrievedAt,
    );
    expect(features).toHaveLength(2);
    expect(new Set(features.map((feature) => feature.id)).size).toBe(2);
    expect(
      features.find((feature) => feature.properties.category === "toilet")
        ?.properties.wheelchair,
    ).toBe("limited");
    expect(
      features.find((feature) => feature.properties.category === "public_space")
        ?.properties.sourceTags.access,
    ).toBe("private");
  });
});

describe("OSM identity, geometry and source time", () => {
  it("uses GeoJSON longitude/latitude and records representative geometry roles", () => {
    const point = first({ amenity: "toilets" });
    expect(point.geometry.coordinates).toEqual([151.005, -33.815]);
    expect(point.properties.geometryRole).toBe("mapped_point");
    const way = normaliseOsmElement(
      {
        type: "way",
        id: 101,
        center: { lat: -33.815, lon: 151.005 },
        tags: { amenity: "toilets" },
      },
      area,
      retrievedAt,
    )[0];
    expect(way.id).not.toBe(point.id);
    expect(way.properties.geometryRole).toBe("approximate_bbox_centre");
    expect(way.properties.routeEndpoint).toBe(false);
    expect(way.properties.source.url).toBe(
      "https://www.openstreetmap.org/way/101",
    );
  });

  it("does not relabel retrieval or OSM edit time as an observation", () => {
    const feature = first(
      { amenity: "toilets" },
      {
        timestamp: "2026-10-01T11:00:00Z",
        version: 3,
      },
    );
    expect(feature.properties.source.retrievedAt).toBe(retrievedAt);
    expect(feature.properties.source.sourceUpdatedAt).toBe(
      "2026-10-01T11:00:00Z",
    );
    expect(feature.properties.source.checkedAt).toBeNull();
    expect(feature.properties.source.osmVersion).toBe(3);
    expect(feature.properties.observedAt).toBeUndefined();
    expect(feature.properties.evidence[0].observedAt).toBeUndefined();
  });

  it("keeps generic existence checks separate from field-specific checks", () => {
    const existence = first({ amenity: "toilets", check_date: "2026-11-01" });
    expect(existence.properties.source.checkedScope).toBe(
      "existence only; access details not established",
    );
    const specific = first({
      amenity: "cafe",
      toilets: "yes",
      check_date: "2026-11-27",
      "check_date:wheelchair": "2026-11-26",
      "check_date:toilets:wheelchair": "2026-10-02",
    });
    expect(specific.properties.source.checkedAt).toBe("2026-10-02");
    expect(specific.properties.source.checkedScope).toBe(
      "check_date:toilets:wheelchair",
    );
  });

  it("ignores invalid or future source check dates while preserving their raw tags", () => {
    const feature = first(
      {
        amenity: "toilets",
        "check_date:wheelchair": "2026-02-31",
        "survey:date": "2027-01-01",
        check_date: "2026-10-01",
      },
      { timestamp: "2026-02-31T00:00:00Z" },
    );
    expect(feature.properties.source.sourceUpdatedAt).toBeNull();
    expect(feature.properties.source.checkedAt).toBe("2026-10-01");
    expect(feature.properties.sourceTags["check_date:wheelchair"]).toBe(
      "2026-02-31",
    );
    expect(feature.properties.sourceTags["survey:date"]).toBe("2027-01-01");
  });

  it("accepts a legitimate Sydney survey day ahead of the UTC calendar day", () => {
    const feature = normaliseOsmElement(
      node({
        amenity: "toilets",
        "check_date:wheelchair": "2026-11-28",
      }),
      area,
      "2026-11-27T14:00:00Z",
    )[0];
    expect(feature.properties.source.checkedAt).toBe("2026-11-28");
  });

  it("does not include an out-of-window relation centre", () => {
    expect(
      normaliseOsmElement(
        {
          type: "relation",
          id: 4,
          center: { lat: -34, lon: 151.005 },
          tags: { leisure: "park" },
        },
        area,
        retrievedAt,
      ),
    ).toEqual([]);
  });

  it.each([
    { lon: Number.NaN },
    { lat: Number.POSITIVE_INFINITY },
    { lon: 181 },
    { lat: -91 },
    { id: 0 },
    { id: Number.MAX_SAFE_INTEGER + 1 },
    { type: "not_osm" },
  ])("rejects invalid identity or display coordinates %j", (extra) => {
    expect(() =>
      normaliseOsmElement(
        node({ amenity: "toilets" }, extra),
        area,
        retrievedAt,
      ),
    ).toThrow();
  });
});

describe("OSM ingestion boundaries", () => {
  it("allowlists, strips control characters and bounds public tag text", () => {
    const tags = sourceTags({
      name: " A\u0000B ",
      description: "x".repeat(1500),
      user: "mapper name",
      uid: "999",
      contact: "private",
      wheelchair: false,
    });
    expect(tags).toEqual({ name: "A B", description: "x".repeat(1200) });
  });

  it("rejects partial responses even when they contain valid elements", () => {
    expect(() =>
      normaliseOverpassResponse(
        {
          elements: [node({ amenity: "toilets" })],
          remark: "runtime error: Query timed out",
        },
        area,
        retrievedAt,
      ),
    ).toThrow("incomplete or failed");
  });

  it("rejects capped, malformed and invalid-date responses before snapshot replacement", () => {
    expect(() =>
      normaliseOverpassResponse(
        {
          elements: Array(MAX_SOURCE_ELEMENTS + 1).fill(
            node({ amenity: "toilets" }),
          ),
        },
        area,
        retrievedAt,
      ),
    ).toThrow("missing or capped");
    expect(() =>
      normaliseOverpassResponse({ elements: {} }, area, retrievedAt),
    ).toThrow();
    expect(() =>
      normaliseOverpassResponse({ elements: [] }, area, "2026-02-31T00:00:00Z"),
    ).toThrow("Invalid retrieval time");
  });

  it("deduplicates repeat identities without collapsing distinct OSM types", () => {
    const result = normaliseOverpassResponse(
      {
        elements: [
          node({ amenity: "toilets" }),
          node({ amenity: "toilets" }),
          {
            type: "relation",
            id: 101,
            center: { lat: -33.815, lon: 151.005 },
            tags: { amenity: "toilets" },
          },
        ],
      },
      area,
      retrievedAt,
    );
    expect(result.inputElementCount).toBe(3);
    expect(result.features.map((feature) => feature.id)).toEqual([
      "osm:node:101:toilet",
      "osm:relation:101:toilet",
    ]);
  });
});
