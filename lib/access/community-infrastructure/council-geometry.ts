/** Maintainer-only boundary validation and point lookup. No runtime data imports. */
import type {
  CouncilBoundaryMatch,
  CouncilJurisdiction,
} from "./council-types";

const SOURCE_URL =
  "https://portal.spatial.nsw.gov.au/server/rest/services/NSW_Administrative_Boundaries_Theme_multiCRS/FeatureServer/8";
const COUNCIL_IDS: Record<string, string> = {
  "CITY OF PARRAMATTA": "city_of_parramatta",
  CUMBERLAND: "cumberland_city",
  BLACKTOWN: "blacktown_city",
  PENRITH: "penrith_city",
  FAIRFIELD: "fairfield_city",
  "THE HILLS SHIRE": "the_hills_shire",
};

const MAX_FEATURES = 32;
const MAX_VERTICES = 100_000;
const MAX_BOUNDARY_BYTES = 4_000_000;
/** Floating-point comparison tolerance in degrees, not a GPS accuracy buffer. */
export const COUNCIL_EDGE_EPSILON = 1e-10;

type Coordinate = [number, number];
type Bounds = [number, number, number, number];
type Ring = Coordinate[];
type Polygon = { rings: Ring[]; bounds: Bounds };
type Boundary = { match: CouncilBoundaryMatch; polygons: Polygon[] };

export type CouncilBoundarySnapshot = {
  retrievedAt: string;
  queryBounds: Bounds;
  boundaries: Boundary[];
};

function object(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new Error("Invalid council boundary object");
  return value as Record<string, unknown>;
}

function coordinate(value: unknown): Coordinate {
  if (
    !Array.isArray(value) ||
    value.length !== 2 ||
    typeof value[0] !== "number" ||
    typeof value[1] !== "number" ||
    !Number.isFinite(value[0]) ||
    !Number.isFinite(value[1]) ||
    value[0] < -180 ||
    value[0] > 180 ||
    value[1] < -90 ||
    value[1] > 90
  )
    throw new Error("Invalid council boundary WGS84 coordinate");
  return [value[0], value[1]];
}

function bounds(value: unknown): Bounds {
  if (!Array.isArray(value) || value.length !== 4)
    throw new Error("Invalid council query envelope");
  const [west, south] = coordinate(value.slice(0, 2));
  const [east, north] = coordinate(value.slice(2, 4));
  if (west >= east || south >= north || east - west > 180)
    throw new Error("Invalid council query envelope");
  return [west, south, east, north];
}

function insideBounds([x, y]: Coordinate, [w, s, e, n]: Bounds): boolean {
  return (
    x >= w - COUNCIL_EDGE_EPSILON &&
    x <= e + COUNCIL_EDGE_EPSILON &&
    y >= s - COUNCIL_EDGE_EPSILON &&
    y <= n + COUNCIL_EDGE_EPSILON
  );
}

function timestamp(value: unknown): string {
  if (
    typeof value !== "string" ||
    !/^\d{4}-\d{2}-\d{2}T(?:[01]\d|2[0-3]):[0-5]\d:[0-5]\d(?:\.\d{1,6})?(?:Z|[+-](?:[01]\d|2[0-3]):[0-5]\d)$/.test(
      value,
    ) ||
    !Number.isFinite(Date.parse(value)) ||
    new Date(`${value.slice(0, 10)}T00:00:00Z`).toISOString().slice(0, 10) !==
      value.slice(0, 10)
  )
    throw new Error("Invalid council boundary retrieval time");
  return value;
}

/**
 * Pure, bounded structural validation of the official immutable extract.
 * The caller supplies byte length and SHA-256 calculated from the original bytes.
 * This is not a survey-accuracy or full cadastral-topology certification.
 */
export function parseCouncilBoundarySnapshot(
  raw: unknown,
  rawReceipt: unknown,
  integrity: { byteLength: number; sha256: string },
): CouncilBoundarySnapshot {
  const data = object(raw);
  const receipt = object(rawReceipt);
  const countCheck = object(receipt.sourceCountCheck);
  const query = object(receipt.queryParameters);
  if (
    receipt.serviceUrl !== SOURCE_URL ||
    receipt.sourceSpatialReference !== 7844 ||
    receipt.requestedOutputSpatialReference !== 4326 ||
    receipt.licence !== "CC-BY-4.0" ||
    receipt.licenceUrl !== "https://creativecommons.org/licenses/by/4.0/" ||
    receipt.httpStatus !== 200 ||
    query.inSR !== "4326" ||
    query.outSR !== "4326" ||
    query.geometryType !== "esriGeometryEnvelope" ||
    query.spatialRel !== "esriSpatialRelIntersects" ||
    query.returnGeometry !== "true" ||
    query.f !== "geojson"
  )
    throw new Error("Invalid council boundary source receipt");
  if (
    !Number.isSafeInteger(integrity.byteLength) ||
    integrity.byteLength < 1 ||
    integrity.byteLength > MAX_BOUNDARY_BYTES ||
    receipt.byteLength !== integrity.byteLength ||
    typeof receipt.sha256 !== "string" ||
    !/^[a-f0-9]{64}$/.test(receipt.sha256) ||
    receipt.sha256 !== integrity.sha256
  )
    throw new Error("Council boundary receipt integrity mismatch");
  if (
    data.type !== "FeatureCollection" ||
    !Array.isArray(data.features) ||
    data.features.length < 1 ||
    data.features.length > MAX_FEATURES ||
    data.features.length !== receipt.featureCount ||
    data.features.length !== countCheck.count ||
    "error" in data ||
    "error" in countCheck ||
    data.exceededTransferLimit === true ||
    countCheck.exceededTransferLimit === true ||
    "crs" in data
  )
    throw new Error("Missing, malformed or truncated council boundaries");
  const queryBounds = bounds(receipt.inputEnvelopeWgs84);
  if (query.geometry !== queryBounds.join(",") || query.where !== "1=1")
    throw new Error("Invalid council boundary query scope");
  const retrievedAt = timestamp(receipt.retrievedAt);
  const seenIds = new Set<string>();
  const seenObjects = new Set<number>();
  const seenCouncils = new Set<string>();
  let vertexCount = 0;

  const boundaries = data.features.map((entry): Boundary => {
    const feature = object(entry);
    const properties = object(feature.properties);
    const geometry = object(feature.geometry);
    const sourceName = properties.lganame;
    if (
      feature.type !== "Feature" ||
      typeof sourceName !== "string" ||
      !Object.prototype.hasOwnProperty.call(COUNCIL_IDS, sourceName) ||
      typeof properties.councilname !== "string" ||
      !/^[A-Z][A-Z '\-]{1,79}$/.test(properties.councilname) ||
      typeof properties.OBJECTID !== "number" ||
      !Number.isSafeInteger(properties.OBJECTID) ||
      properties.OBJECTID < 1 ||
      feature.id !== properties.OBJECTID ||
      typeof properties.abscode !== "number" ||
      !Number.isSafeInteger(properties.abscode) ||
      properties.abscode < 0 ||
      typeof properties.shapeuuid !== "string" ||
      !/^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i.test(
        properties.shapeuuid,
      )
    )
      throw new Error("Invalid or unmapped council boundary identity");
    const councilId = COUNCIL_IDS[sourceName];
    if (
      seenIds.has(properties.shapeuuid) ||
      seenObjects.has(properties.OBJECTID) ||
      seenCouncils.has(councilId)
    )
      throw new Error("Duplicate council boundary identity");
    seenIds.add(properties.shapeuuid);
    seenObjects.add(properties.OBJECTID);
    seenCouncils.add(councilId);

    const candidates =
      geometry.type === "Polygon"
        ? [geometry.coordinates]
        : geometry.type === "MultiPolygon"
          ? geometry.coordinates
          : null;
    if (
      !Array.isArray(candidates) ||
      candidates.length < 1 ||
      candidates.length > 64
    )
      throw new Error("Invalid council Polygon or MultiPolygon");
    const polygons = candidates.map((candidate): Polygon => {
      if (
        !Array.isArray(candidate) ||
        candidate.length < 1 ||
        candidate.length > 256
      )
        throw new Error("Invalid council polygon rings");
      const polygonBounds: Bounds = [180, 90, -180, -90];
      const rings = candidate.map((value): Ring => {
        if (!Array.isArray(value) || value.length < 4)
          throw new Error("Invalid council polygon ring");
        vertexCount += value.length;
        if (vertexCount > MAX_VERTICES)
          throw new Error("Council boundary vertex limit exceeded");
        const ring = value.map(coordinate);
        const first = ring[0];
        const last = ring[ring.length - 1];
        if (first[0] !== last[0] || first[1] !== last[1])
          throw new Error("Unclosed council polygon ring");
        let twiceArea = 0;
        for (let i = 0; i < ring.length - 1; i++) {
          const [x, y] = ring[i];
          const [nextX, nextY] = ring[i + 1];
          if (Math.abs(nextX - x) > 180)
            throw new Error("Unsupported antimeridian council ring");
          twiceArea +=
            (x - first[0]) * (nextY - first[1]) -
            (nextX - first[0]) * (y - first[1]);
          polygonBounds[0] = Math.min(polygonBounds[0], x);
          polygonBounds[1] = Math.min(polygonBounds[1], y);
          polygonBounds[2] = Math.max(polygonBounds[2], x);
          polygonBounds[3] = Math.max(polygonBounds[3], y);
        }
        if (Math.abs(twiceArea) <= Number.EPSILON)
          throw new Error("Degenerate council polygon ring");
        return ring;
      });
      return { rings, bounds: polygonBounds };
    });
    return {
      match: {
        councilId,
        councilName: properties.councilname
          .toLowerCase()
          .replace(/\b[a-z]/g, (letter) => letter.toUpperCase())
          .replace(/\bOf\b/g, "of"),
        sourceFeatureId: properties.shapeuuid,
        sourceObjectId: properties.OBJECTID,
        sourceCode: properties.abscode,
      },
      polygons,
    };
  });
  return { retrievedAt, queryBounds, boundaries };
}

type Position = "inside" | "outside" | "boundary";

function ringPosition([x, y]: Coordinate, ring: Ring): Position {
  let inside = false;
  for (let i = 0; i < ring.length - 1; i++) {
    const [ax, ay] = ring[i];
    const [bx, by] = ring[i + 1];
    const dx = bx - ax;
    const dy = by - ay;
    const lengthSquared = dx * dx + dy * dy;
    const fraction =
      lengthSquared === 0
        ? 0
        : Math.max(
            0,
            Math.min(1, ((x - ax) * dx + (y - ay) * dy) / lengthSquared),
          );
    if (
      Math.hypot(x - (ax + fraction * dx), y - (ay + fraction * dy)) <=
      COUNCIL_EDGE_EPSILON
    )
      return "boundary";
    if (ay > y !== by > y && x < (dx * (y - ay)) / dy + ax) inside = !inside;
  }
  return inside ? "inside" : "outside";
}

function polygonPosition(point: Coordinate, polygon: Polygon): Position {
  if (!insideBounds(point, polygon.bounds)) return "outside";
  const outer = ringPosition(point, polygon.rings[0]);
  if (outer !== "inside") return outer;
  for (const hole of polygon.rings.slice(1)) {
    const position = ringPosition(point, hole);
    if (position === "boundary") return "boundary";
    if (position === "inside") return "outside";
  }
  return "inside";
}

/**
 * Match the displayed point only, including approximate OSM bounding-box centres.
 * Any outer/hole edge touch or multiple matches needs review. The numerical edge
 * tolerance does not cover source positional uncertainty or an entire facility.
 */
export function councilJurisdictionForPoint(
  rawPoint: unknown,
  snapshot: CouncilBoundarySnapshot,
): CouncilJurisdiction {
  const point = coordinate(rawPoint);
  if (!insideBounds(point, snapshot.queryBounds))
    throw new Error("Display point outside council boundary query envelope");
  const matches: CouncilBoundaryMatch[] = [];
  let touchesBoundary = false;
  for (const boundary of snapshot.boundaries) {
    const positions = boundary.polygons.map((polygon) =>
      polygonPosition(point, polygon),
    );
    if (positions.some((position) => position !== "outside")) {
      matches.push({ ...boundary.match });
      if (positions.includes("boundary")) touchesBoundary = true;
    }
  }
  matches.sort((a, b) => a.councilId.localeCompare(b.councilId));
  return {
    status:
      touchesBoundary || matches.length > 1
        ? "ambiguous"
        : matches.length === 1
          ? "matched"
          : "unmatched",
    method: "display_point_in_polygon",
    coordinate: point,
    matches,
    boundarySourceId: "nsw-spatial-services-lga",
    boundaryRetrievedAt: snapshot.retrievedAt,
    assetOwnership: "not_established",
  };
}
