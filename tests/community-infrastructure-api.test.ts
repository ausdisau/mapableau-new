import { describe, expect, it } from "vitest";

import { GET, OPTIONS } from "@/app/api/access/community-infrastructure/route";
import shippedSnapshotData from "@/data/community-infrastructure/osm-snapshot.json";
import {
  COMMUNITY_AREAS,
  MAX_SOURCE_ELEMENTS,
  OSM_ATTRIBUTION,
  OSM_LICENCE_URL,
} from "@/lib/access/community-infrastructure/config";
import {
  COUNCIL_BOUNDARY_SOURCE,
  COUNCIL_REFERENCES,
  getCouncilLinkage,
} from "@/lib/access/community-infrastructure/council-references";
import { normaliseOverpassResponse } from "@/lib/access/community-infrastructure/normalise";
import {
  getCommunityInfrastructure,
  parseCommunityQuery,
} from "@/lib/access/community-infrastructure/service";
import type { CommunitySnapshot } from "@/lib/access/community-infrastructure/types";

const retrieval = "2026-11-28T10:00:00.000Z";
const region = normaliseOverpassResponse(
  {
    elements: [
      {
        type: "node",
        id: 1,
        lon: 151,
        lat: -33.81,
        tags: { amenity: "toilets", wheelchair: "yes" },
      },
      {
        type: "node",
        id: 2,
        lon: 151.001,
        lat: -33.811,
        tags: { amenity: "toilets" },
      },
      {
        type: "node",
        id: 3,
        lon: 151.002,
        lat: -33.812,
        tags: {
          amenity: "parking_space",
          parking_space: "disabled",
          wheelchair: "no",
        },
      },
    ],
  },
  COMMUNITY_AREAS[0],
  retrieval,
);
const snapshot: CommunitySnapshot = {
  schemaVersion: "1.0.0",
  generatedAt: retrieval,
  areas: { parramatta: region },
};

describe("community infrastructure public query", () => {
  it("returns unknown facilities by default and filters unknown independently from no", () => {
    const all = getCommunityInfrastructure(
      parseCommunityQuery(new URLSearchParams()),
      snapshot,
    );
    expect(all.features).toHaveLength(3);
    const unknown = getCommunityInfrastructure(
      parseCommunityQuery(new URLSearchParams("wheelchair=unknown")),
      snapshot,
    );
    expect(unknown.features.map((feature) => feature.id)).toEqual([
      "osm:node:2:toilet",
    ]);
    const no = getCommunityInfrastructure(
      parseCommunityQuery(new URLSearchParams("wheelchair=no")),
      snapshot,
    );
    expect(no.features[0].properties.category).toBe("parking");
  });

  it("uses bounded pagination with stable records and explicit truncation", () => {
    const first = getCommunityInfrastructure(
      parseCommunityQuery(new URLSearchParams("limit=2")),
      snapshot,
    );
    const last = getCommunityInfrastructure(
      parseCommunityQuery(new URLSearchParams("limit=2&offset=2")),
      snapshot,
    );
    expect(first.meta).toMatchObject({
      featureCount: 2,
      totalMatched: 3,
      truncated: true,
    });
    expect(last.meta).toMatchObject({
      featureCount: 1,
      totalMatched: 3,
      truncated: false,
    });
    expect(
      new Set(
        [...first.features, ...last.features].map((feature) => feature.id),
      ).size,
    ).toBe(3);
  });

  it("filters valid WGS84 bbox without transposing coordinates", () => {
    const result = getCommunityInfrastructure(
      parseCommunityQuery(
        new URLSearchParams("bbox=150.999,-33.8105,151.0005,-33.8095"),
      ),
      snapshot,
    );
    expect(result.features).toHaveLength(1);
    expect(result.features[0].geometry.coordinates).toEqual([151, -33.81]);
  });

  it.each([
    "area=world",
    "category=verified",
    "wheelchair=true",
    "council=parramatta",
    "council=",
    "council=city_of_parramatta&council=cumberland_city",
    "limit=501",
    "limit=0",
    "offset=-1",
    "offset=100001",
    "area=parramatta&area=penrith",
    "endpoint=https://example.com",
    "bbox=0,0,180,90",
    "bbox=NaN,-33.82,151,-33.81",
    "bbox=151,-33.81,150.99,-33.82",
    "format=html",
    "limit=",
    "offset=1e2",
  ])("rejects unsupported or unbounded input: %s", (query) => {
    expect(() => parseCommunityQuery(new URLSearchParams(query))).toThrow();
  });

  it("distinguishes unloaded areas from an empty filtered source snapshot", () => {
    const unloaded = getCommunityInfrastructure(
      parseCommunityQuery(new URLSearchParams("area=penrith")),
      snapshot,
    );
    expect(unloaded.meta).toMatchObject({
      dataStatus: "not_loaded",
      generatedAt: null,
    });
    const filtered = getCommunityInfrastructure(
      parseCommunityQuery(new URLSearchParams("category=public_space")),
      snapshot,
    );
    expect(filtered.meta).toMatchObject({
      dataStatus: "source_snapshot",
      generatedAt: retrieval,
      featureCount: 0,
    });
  });

  it("preserves ODbL provenance and GAIS community-reported evidence", () => {
    const result = getCommunityInfrastructure(
      parseCommunityQuery(new URLSearchParams()),
      snapshot,
    );
    expect(result.meta.sources[0].licence).toBe("ODbL-1.0");
    expect(result.meta.sources[1].licence).toBe("CC-BY-4.0");
    expect(result.meta.liveNationalRouting).toBe(false);
    expect(
      result.features.every(
        (feature) =>
          feature.properties.gaisEvidenceState === "COMMUNITY_REPORTED",
      ),
    ).toBe(true);
    expect(
      result.features.every(
        (feature) => feature.properties.routeEndpoint === false,
      ),
    ).toBe(true);
  });

  it("serves a public GeoJSON response and excludes cookies/private cache state", async () => {
    const response = GET(
      new Request(
        "https://mapable.example/api/access/community-infrastructure?area=parramatta",
      ),
    );
    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain(
      "application/geo+json",
    );
    expect(response.headers.get("cache-control")).toContain("public");
    expect(response.headers.get("link")).toContain('rel="license"');
    expect(response.headers.get("link")).toContain(OSM_LICENCE_URL);
    expect(response.headers.get("link")).toContain(
      COUNCIL_BOUNDARY_SOURCE.licenceUrl,
    );
    expect(response.headers.get("set-cookie")).toBeNull();
    expect(response.headers.get("access-control-allow-origin")).toBe("*");
    expect(response.headers.get("access-control-allow-credentials")).toBeNull();
    expect(response.headers.get("access-control-expose-headers")).toBe("Link");
    const body = await response.json();
    expect(body.type).toBe("FeatureCollection");
    expect(body.meta.schemaVersion).toBe("1.0.0");
  });

  it("allows credential-free external map reads through a bounded preflight", async () => {
    const response = OPTIONS();
    expect(response.status).toBe(204);
    expect(await response.text()).toBe("");
    expect(response.headers.get("access-control-allow-origin")).toBe("*");
    expect(response.headers.get("access-control-allow-credentials")).toBeNull();
    expect(response.headers.get("set-cookie")).toBeNull();
    expect(
      response.headers
        .get("access-control-allow-methods")
        ?.split(",")
        .map((method) => method.trim())
        .sort(),
    ).toEqual(["GET", "HEAD", "OPTIONS"]);
    expect(response.headers.get("access-control-allow-headers")).toBe("Accept");
  });

  it("returns explicit noncacheable query errors without source calls", async () => {
    const response = GET(
      new Request(
        "https://mapable.example/api/access/community-infrastructure?area=world",
      ),
    );
    expect(response.status).toBe(400);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(response.headers.get("access-control-allow-origin")).toBe("*");
    expect(response.headers.get("access-control-allow-credentials")).toBeNull();
    expect((await response.json()).code).toBe("INVALID_QUERY");
  });
});

describe("council linkages over the selected study window", () => {
  it("defaults to all and returns actual boundary councils rather than the study-area label", () => {
    const query = parseCommunityQuery(new URLSearchParams());
    expect(query.council).toBe("all");
    const result = getCommunityInfrastructure(query);
    expect(
      result.meta.councilLinkage?.councils.map((council) => [
        council.id,
        council.featureCount,
      ]),
    ).toEqual([
      ["city_of_parramatta", 157],
      ["cumberland_city", 8],
    ]);
    expect(result.meta.councilLinkage).toMatchObject({
      ambiguousFeatureCount: 0,
      unmatchedFeatureCount: 0,
      notJoinedFeatureCount: 0,
    });
  });

  it("filters Cumberland records inside the Parramatta study window without changing evidence", () => {
    const result = getCommunityInfrastructure(
      parseCommunityQuery(
        new URLSearchParams("area=parramatta&council=cumberland_city"),
      ),
    );
    expect(result.meta.totalMatched).toBe(8);
    expect(result.features).toHaveLength(8);
    for (const feature of result.features) {
      expect(feature.properties.area).toBe("parramatta");
      expect(feature.properties.councilJurisdiction).toMatchObject({
        status: "matched",
        matches: [{ councilId: "cumberland_city" }],
        assetOwnership: "not_established",
      });
      expect(feature.properties.gaisEvidenceState).toBe("COMMUNITY_REPORTED");
      expect(feature.properties.routeEndpoint).toBe(false);
    }
  });

  it("keeps council counts for the whole window when results are filtered or paged", () => {
    const full = getCommunityInfrastructure(
      parseCommunityQuery(new URLSearchParams()),
    );
    const filtered = getCommunityInfrastructure(
      parseCommunityQuery(
        new URLSearchParams(
          "category=parking&wheelchair=unknown&limit=1&council=city_of_parramatta",
        ),
      ),
    );
    expect(filtered.features).toHaveLength(1);
    expect(filtered.meta.councilLinkage).toEqual(full.meta.councilLinkage);
    expect(filtered.meta.attribution).toContain(
      COUNCIL_BOUNDARY_SOURCE.attribution,
    );
  });

  it("does not turn ambiguous, unmatched or missing joins into definite council results", () => {
    const fixture = structuredClone(snapshot);
    const sample = getCommunityInfrastructure(
      parseCommunityQuery(
        new URLSearchParams("council=city_of_parramatta&limit=1"),
      ),
    ).features[0].properties.councilJurisdiction!;
    const features = fixture.areas.parramatta!.features;
    features[0].properties.councilJurisdiction = {
      ...sample,
      status: "ambiguous",
      coordinate: features[0].geometry.coordinates,
    };
    features[1].properties.councilJurisdiction = {
      ...sample,
      status: "unmatched",
      matches: [],
      coordinate: features[1].geometry.coordinates,
    };
    const result = getCommunityInfrastructure(
      parseCommunityQuery(new URLSearchParams("council=city_of_parramatta")),
      fixture,
    );
    expect(result.features).toHaveLength(0);
    expect(getCouncilLinkage(features)).toMatchObject({
      councils: [],
      ambiguousFeatureCount: 1,
      unmatchedFeatureCount: 1,
      notJoinedFeatureCount: 1,
    });
  });

  it("keeps official reference links distinct from licensed boundary data and facility imports", () => {
    expect(new Set(COUNCIL_REFERENCES.map((council) => council.id)).size).toBe(
      6,
    );
    const links = COUNCIL_REFERENCES.flatMap((council) => council.sourceLinks);
    expect(links).toHaveLength(18);
    expect(new Set(links.map((link) => link.id)).size).toBe(links.length);
    for (const link of links) {
      expect(new URL(link.url).protocol).toBe("https:");
      expect(link.importEnabled).toBe(false);
      expect(link.bulkReuseStatus).toBe("not_established");
      expect(Number.isFinite(Date.parse(link.reviewedAt))).toBe(true);
    }
    expect(COUNCIL_BOUNDARY_SOURCE.licence).toBe("CC-BY-4.0");
    expect(COUNCIL_BOUNDARY_SOURCE.outputSpatialReference).toBe(4326);
  });
});

describe("checked-in community infrastructure snapshot", () => {
  // JSON imports widen literal values and coordinate tuples. These tests check
  // the actual generated artifact, independently of the synthetic fixtures.
  const shipped = shippedSnapshotData as unknown as CommunitySnapshot;

  it("contains exactly the configured study areas and globally unique feature IDs", () => {
    expect(shipped).toBeTypeOf("object");
    expect(shipped.schemaVersion).toBe("1.0.0");
    expect(shipped.generatedAt).toBeTypeOf("string");
    expect(Number.isFinite(Date.parse(shipped.generatedAt!))).toBe(true);
    expect(Object.keys(shipped.areas).sort()).toEqual(
      COMMUNITY_AREAS.map((area) => area.id).sort(),
    );
    const ids = Object.values(shipped.areas).flatMap((area) =>
      area!.features.map((feature) => feature.id),
    );
    expect(new Set(ids).size).toBe(ids.length);
  });

  it.each(COMMUNITY_AREAS)(
    "validates every shipped point and source assertion for $id",
    (area) => {
      const imported = shipped.areas[area.id];
      expect(imported).toBeDefined();
      if (!imported) throw new Error(`Missing shipped area: ${area.id}`);
      expect(imported.retrievedAt).toBeTypeOf("string");
      expect(Number.isFinite(Date.parse(imported.retrievedAt))).toBe(true);
      expect(imported.osmBaseTimestamp).toBeTypeOf("string");
      expect(Number.isFinite(Date.parse(imported.osmBaseTimestamp!))).toBe(
        true,
      );
      expect(Number.isInteger(imported.inputElementCount)).toBe(true);
      expect(imported.inputElementCount).toBeGreaterThan(0);
      expect(imported.inputElementCount).toBeLessThanOrEqual(
        MAX_SOURCE_ELEMENTS,
      );
      expect(Array.isArray(imported.features)).toBe(true);
      expect(imported.features.length).toBeGreaterThan(0);
      expect(imported.features.length).toBeLessThanOrEqual(
        imported.inputElementCount * 3,
      );

      const [west, south, east, north] = area.bbox;
      for (const feature of imported.features) {
        expect(feature.type).toBe("Feature");
        expect(feature.id).toMatch(
          /^osm:(node|way|relation):[1-9]\d*:(parking|toilet|public_space)$/,
        );
        expect(feature.geometry.type).toBe("Point");
        expect(Array.isArray(feature.geometry.coordinates)).toBe(true);
        expect(feature.geometry.coordinates).toHaveLength(2);
        const [longitude, latitude] = feature.geometry.coordinates;
        expect(Number.isFinite(longitude)).toBe(true);
        expect(Number.isFinite(latitude)).toBe(true);
        expect(longitude).toBeGreaterThanOrEqual(west);
        expect(longitude).toBeLessThanOrEqual(east);
        expect(latitude).toBeGreaterThanOrEqual(south);
        expect(latitude).toBeLessThanOrEqual(north);

        const properties = feature.properties;
        expect(properties.id).toBe(feature.id);
        expect(properties.gaisFeatureId).toBe(feature.id);
        expect(properties.area).toBe(area.id);
        expect(properties.councilJurisdiction?.boundaryRetrievedAt).toBe(
          COUNCIL_BOUNDARY_SOURCE.retrievedAt,
        );
        expect(["parking", "toilet", "public_space"]).toContain(
          properties.category,
        );
        expect(["yes", "limited", "no", "designated", "unknown"]).toContain(
          properties.wheelchair,
        );
        expect(properties.name).toBeTypeOf("string");
        expect(properties.name.trim().length).toBeGreaterThan(0);
        expect(properties.routeEndpoint).toBe(false);
        expect(properties.facts.routeEndpoint).toBe(false);
        expect(properties.gaisEvidenceState).toBe("COMMUNITY_REPORTED");
        expect(properties).not.toHaveProperty("observedAt");
        expect(properties.facts).not.toHaveProperty("observedAt");
        expect(properties).not.toHaveProperty("confidence");
        expect(properties.evidence).toHaveLength(1);
        expect(properties.evidence[0].sourceType).toBe("COMMUNITY_REPORTED");
        expect(properties.evidence[0]).not.toHaveProperty("observedAt");
        expect(properties.evidence[0]).not.toHaveProperty("verifiedAt");

        const source = properties.source;
        const identity = /^osm:(node|way|relation):([1-9]\d*)$/.exec(source.id);
        expect(identity).not.toBeNull();
        if (!identity) throw new Error(`Invalid source identity: ${source.id}`);
        expect(Number.isSafeInteger(Number(identity[2]))).toBe(true);
        expect(feature.id).toBe(`${source.id}:${properties.category}`);
        expect(source.url).toBe(
          `https://www.openstreetmap.org/${identity[1]}/${identity[2]}`,
        );
        expect(source.licence).toBe("ODbL-1.0");
        expect(source.licenceUrl).toBe(OSM_LICENCE_URL);
        expect(source.attribution).toBe(OSM_ATTRIBUTION);
        expect(source.retrievedAt).toBe(imported.retrievedAt);
        expect(properties.facts.sourceUrl).toBe(source.url);
        expect(properties.geometryRole).toBe(
          identity[1] === "node" ? "mapped_point" : "approximate_bbox_centre",
        );
        expect(Array.isArray(properties.accessFacts)).toBe(true);
        expect(Array.isArray(properties.unknownAttributes)).toBe(true);
        expect(properties.unknownAttributes).toContain(
          "Independent MapAble assessment",
        );
        expect(properties.unknownAttributes).toContain(
          "Accessible route connection",
        );
        for (const fact of properties.accessFacts) {
          expect(fact.label).toBeTypeOf("string");
          expect(fact.value).toBe(properties.sourceTags[fact.key]);
        }
        for (const value of Object.values(properties.sourceTags)) {
          expect(value).toBeTypeOf("string");
          expect(value.length).toBeLessThanOrEqual(1200);
          expect(value).not.toMatch(/[\u0000-\u001f\u007f]/);
        }
        for (const key of ["user", "uid", "participantId", "reporterUserId"]) {
          expect(properties).not.toHaveProperty(key);
          expect(properties.sourceTags).not.toHaveProperty(key);
        }
      }

      const publicCollection = getCommunityInfrastructure(
        parseCommunityQuery(new URLSearchParams({ area: area.id })),
      );
      expect(publicCollection.meta.totalMatched).toBe(imported.features.length);
      expect(publicCollection.meta.featureCount).toBe(
        publicCollection.features.length,
      );
      expect(publicCollection.meta.dataStatus).toBe("source_snapshot");
      expect(publicCollection.meta.claimState).toBe(
        "source_reported_not_independently_verified",
      );
      expect(publicCollection.meta.liveNationalRouting).toBe(false);
    },
  );
});
