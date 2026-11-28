import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import {
  COUNCIL_EDGE_EPSILON,
  councilJurisdictionForPoint,
  parseCouncilBoundarySnapshot,
} from "@/lib/access/community-infrastructure/council-geometry";
import type { CommunitySnapshot } from "@/lib/access/community-infrastructure/types";

const sourceUrl =
  "https://portal.spatial.nsw.gov.au/server/rest/services/NSW_Administrative_Boundaries_Theme_multiCRS/FeatureServer/8";
const outer = [
  [150, -34],
  [151, -34],
  [151, -33],
  [150, -33],
  [150, -34],
];
const hole = [
  [150.25, -33.75],
  [150.75, -33.75],
  [150.75, -33.25],
  [150.25, -33.25],
  [150.25, -33.75],
];

function feature(
  coordinates: unknown = [outer],
  type = "Polygon",
  lganame = "PENRITH",
  id = 1,
) {
  return {
    type: "Feature",
    id,
    properties: {
      OBJECTID: id,
      lganame,
      councilname: `${lganame} CITY COUNCIL`,
      abscode: 6350,
      shapeuuid: `00000000-0000-0000-0000-${String(id).padStart(12, "0")}`,
    },
    geometry: { type, coordinates },
  };
}

function fixture(features = [feature()]) {
  const data = { type: "FeatureCollection", features };
  const bytes = Buffer.from(JSON.stringify(data));
  const integrity = {
    byteLength: bytes.byteLength,
    sha256: createHash("sha256").update(bytes).digest("hex"),
  };
  const receipt = {
    serviceUrl: sourceUrl,
    sourceSpatialReference: 7844,
    requestedOutputSpatialReference: 4326,
    licence: "CC-BY-4.0",
    licenceUrl: "https://creativecommons.org/licenses/by/4.0/",
    httpStatus: 200,
    retrievedAt: "2026-11-28T10:34:26.484467+00:00",
    queryParameters: {
      where: "1=1",
      geometry: "149,-35,153,-32",
      geometryType: "esriGeometryEnvelope",
      inSR: "4326",
      outSR: "4326",
      spatialRel: "esriSpatialRelIntersects",
      returnGeometry: "true",
      f: "geojson",
    },
    inputEnvelopeWgs84: [149, -35, 153, -32],
    ...integrity,
    featureCount: features.length,
    sourceCountCheck: { count: features.length },
  };
  return { data, receipt, integrity };
}

function parsed(features = [feature()]) {
  const { data, receipt, integrity } = fixture(features);
  return parseCouncilBoundarySnapshot(data, receipt, integrity);
}

describe("council boundary geometry", () => {
  it("retains source identity and does not infer asset ownership", () => {
    const result = councilJurisdictionForPoint([150.1, -33.5], parsed());
    expect(result).toEqual({
      status: "matched",
      method: "display_point_in_polygon",
      coordinate: [150.1, -33.5],
      matches: [
        {
          councilId: "penrith_city",
          councilName: "Penrith City Council",
          sourceObjectId: 1,
          sourceFeatureId: "00000000-0000-0000-0000-000000000001",
          sourceCode: 6350,
        },
      ],
      boundarySourceId: "nsw-spatial-services-lga",
      boundaryRetrievedAt: "2026-11-28T10:34:26.484467+00:00",
      assetOwnership: "not_established",
    });
    expect(result).not.toHaveProperty("confidence");
    expect(result).not.toHaveProperty("expiresAt");
  });

  it("excludes holes regardless of ring winding", () => {
    for (const rings of [
      [outer, hole],
      [[...outer].reverse(), [...hole].reverse()],
    ]) {
      const snapshot = parsed([feature(rings)]);
      expect(councilJurisdictionForPoint([150.1, -33.5], snapshot).status).toBe(
        "matched",
      );
      expect(
        councilJurisdictionForPoint([150.5, -33.5], snapshot),
      ).toMatchObject({ status: "unmatched", matches: [] });
    }
  });

  it.each([
    [150, -33.5],
    [150, -34],
    [150.25, -33.5],
  ])("marks an outer edge, vertex or hole edge ambiguous at %j", (x, y) => {
    const result = councilJurisdictionForPoint(
      [x, y],
      parsed([feature([outer, hole])]),
    );
    expect(result.status).toBe("ambiguous");
    expect(result.matches).toHaveLength(1);
  });

  it("uses only an explicit numerical edge tolerance", () => {
    const snapshot = parsed();
    expect(
      councilJurisdictionForPoint(
        [150 + COUNCIL_EDGE_EPSILON / 2, -33.5],
        snapshot,
      ).status,
    ).toBe("ambiguous");
    expect(
      councilJurisdictionForPoint(
        [150 + COUNCIL_EDGE_EPSILON * 8, -33.5],
        snapshot,
      ).status,
    ).toBe("matched");
  });

  it("handles separate MultiPolygon parts without duplicating a council", () => {
    const second = outer.map(([x, y]) => [x + 1, y]);
    const snapshot = parsed([
      feature([[outer, hole], [second]], "MultiPolygon"),
    ]);
    const result = councilJurisdictionForPoint([151.5, -33.5], snapshot);
    expect(result.status).toBe("matched");
    expect(result.matches).toHaveLength(1);
    expect(councilJurisdictionForPoint([150.5, -33.5], snapshot).status).toBe(
      "unmatched",
    );
  });

  it("preserves both councils on a shared edge or an overlap", () => {
    for (const shift of [1, 0.5]) {
      const other = outer.map(([x, y]) => [x + shift, y]);
      const result = councilJurisdictionForPoint(
        [151, -33.5],
        parsed([feature(), feature([other], "Polygon", "BLACKTOWN", 2)]),
      );
      expect(result.status).toBe("ambiguous");
      expect(result.matches.map((match) => match.councilId)).toEqual([
        "blacktown_city",
        "penrith_city",
      ]);
    }
  });

  it("does not choose one council when two polygon interiors overlap", () => {
    const other = outer.map(([x, y]) => [x + 0.5, y]);
    const result = councilJurisdictionForPoint(
      [150.8, -33.5],
      parsed([feature(), feature([other], "Polygon", "BLACKTOWN", 2)]),
    );
    expect(result.status).toBe("ambiguous");
    expect(result.matches).toHaveLength(2);
  });

  it("keeps no match distinct from an invalid or out-of-query point", () => {
    const snapshot = parsed();
    expect(councilJurisdictionForPoint([152.5, -33.5], snapshot)).toMatchObject(
      { status: "unmatched", matches: [] },
    );
    expect(() => councilJurisdictionForPoint([148, -34], snapshot)).toThrow(
      "outside council boundary query envelope",
    );
    expect(() =>
      councilJurisdictionForPoint([Number.NaN, -34], snapshot),
    ).toThrow("WGS84 coordinate");
  });
});

describe("council boundary input validation", () => {
  it("rejects changed bytes or a mismatched receipt checksum", () => {
    const { data, receipt, integrity } = fixture();
    expect(() =>
      parseCouncilBoundarySnapshot(data, receipt, {
        ...integrity,
        sha256: "0".repeat(64),
      }),
    ).toThrow("integrity mismatch");
    expect(() =>
      parseCouncilBoundarySnapshot(data, receipt, {
        ...integrity,
        byteLength: integrity.byteLength + 1,
      }),
    ).toThrow("integrity mismatch");
  });

  it("rejects missing, truncated and failed collections", () => {
    const { data, receipt, integrity } = fixture();
    for (const bad of [
      { ...data, exceededTransferLimit: true },
      { ...data, error: { message: "Query failed" } },
      { ...data, features: [] },
      { ...data, crs: { properties: { name: "EPSG:3857" } } },
    ])
      expect(() =>
        parseCouncilBoundarySnapshot(bad, receipt, integrity),
      ).toThrow();
    expect(() =>
      parseCouncilBoundarySnapshot(
        data,
        { ...receipt, sourceCountCheck: { count: 2 } },
        integrity,
      ),
    ).toThrow("truncated");
  });

  it("requires the fixed source, licence, WGS84 output and genuine receipt date", () => {
    const { data, receipt, integrity } = fixture();
    for (const change of [
      { serviceUrl: "https://example.invalid/boundaries" },
      { licence: "unknown" },
      { requestedOutputSpatialReference: 3857 },
      { retrievedAt: "2026-02-31T00:00:00Z" },
      { retrievedAt: "not a date" },
      { inputEnvelopeWgs84: [153, -35, 149, -32] },
      { queryParameters: { ...receipt.queryParameters, outSR: "7844" } },
    ])
      expect(() =>
        parseCouncilBoundarySnapshot(
          data,
          { ...receipt, ...change },
          integrity,
        ),
      ).toThrow();
  });

  it("rejects unclosed, degenerate, nonfinite and non-polygon geometry", () => {
    for (const badFeature of [
      feature([outer.slice(0, 4)]),
      feature([
        [
          [150, -34],
          [150, -33],
          [150, -32],
          [150, -34],
        ],
      ]),
      feature([
        [
          [150, -34],
          [Number.NaN, -33],
          [151, -33],
          [150, -34],
        ],
      ]),
      feature([
        [
          [150, -34],
          [181, -33],
          [151, -33],
          [150, -34],
        ],
      ]),
      feature([outer], "LineString"),
      feature([], "MultiPolygon"),
    ])
      expect(() => parsed([badFeature])).toThrow();
  });

  it("bounds vertex count and rejects duplicate or unmapped identities", () => {
    expect(() => parsed([feature([Array(100_001).fill([150, -34])])])).toThrow(
      "vertex limit",
    );
    expect(() => parsed([feature(), feature()])).toThrow("Duplicate");
    expect(() =>
      parsed([feature([outer], "Polygon", "UNKNOWN COUNCIL")]),
    ).toThrow("unmapped");
    const malformed = feature();
    malformed.properties.OBJECTID = 0;
    expect(() => parsed([malformed])).toThrow("identity");
  });
});

describe("shipped NSW boundary and OSM snapshot", () => {
  const directory = path.resolve("data/community-infrastructure");
  const boundaryBytes = readFileSync(
    path.join(directory, "nsw-lga-boundaries.geojson"),
  );
  const rawReceipt = JSON.parse(
    readFileSync(
      path.join(directory, "nsw-lga-boundaries-receipt.json"),
      "utf8",
    ),
  );
  const boundarySnapshot = parseCouncilBoundarySnapshot(
    JSON.parse(boundaryBytes.toString("utf8")),
    rawReceipt,
    {
      byteLength: boundaryBytes.byteLength,
      sha256: createHash("sha256").update(boundaryBytes).digest("hex"),
    },
  );
  const osmSnapshot = JSON.parse(
    readFileSync(path.join(directory, "osm-snapshot.json"), "utf8"),
  ) as CommunitySnapshot;

  it("validates the original extract against its count and integrity receipt", () => {
    expect(boundarySnapshot.boundaries.length).toBe(
      rawReceipt.sourceCountCheck.count,
    );
    expect(
      boundarySnapshot.boundaries
        .map((boundary) => boundary.match.councilId)
        .sort(),
    ).toEqual([
      "blacktown_city",
      "city_of_parramatta",
      "cumberland_city",
      "fairfield_city",
      "penrith_city",
      "the_hills_shire",
    ]);
  });

  it("matches stored source points and preserves every original access limitation", () => {
    const actualParramattaCouncils = new Set<string>();
    for (const [areaId, area] of Object.entries(osmSnapshot.areas)) {
      expect(area.features.length).toBeGreaterThan(0);
      for (const entry of area.features) {
        const joined = councilJurisdictionForPoint(
          entry.geometry.coordinates,
          boundarySnapshot,
        );
        expect(joined.status).toBe("matched");
        expect(joined.matches).toHaveLength(1);
        expect(entry.properties.councilJurisdiction).toEqual(joined);
        expect(entry.properties.routeEndpoint).toBe(false);
        expect(entry.properties.gaisEvidenceState).toBe("COMMUNITY_REPORTED");
        expect(joined.assetOwnership).toBe("not_established");
        if (areaId === "parramatta")
          actualParramattaCouncils.add(joined.matches[0].councilId);
      }
    }
    // The study-window name must not be used as the council jurisdiction.
    expect([...actualParramattaCouncils].sort()).toEqual([
      "city_of_parramatta",
      "cumberland_city",
    ]);
  });
});
