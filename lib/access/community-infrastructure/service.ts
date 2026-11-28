import snapshotData from "@/data/community-infrastructure/osm-snapshot.json";

import {
  COMMUNITY_AREAS,
  COMMUNITY_NOTICE,
  getCommunityArea,
  MAX_PUBLIC_FEATURES,
  OSM_ATTRIBUTION,
  OSM_LICENCE_URL,
} from "./config";
import {
  COUNCIL_BOUNDARY_SOURCE,
  getCouncilLinkage,
  getCouncilReference,
} from "./council-references";
import type {
  CommunityAreaId,
  CommunityCategory,
  CommunityInfrastructureCollection,
  CommunitySnapshot,
  WheelchairStatus,
} from "./types";

// This is a generated, checked-in artifact, not request input. TypeScript widens
// JSON coordinate tuples and literal fields to arrays/strings. The ingester
// validates source data; shipped-snapshot invariant tests validate this boundary
// again, including every point, source identity and claim state in all areas.
const bundledSnapshot = snapshotData as unknown as CommunitySnapshot;

export type CommunityQuery = {
  area: CommunityAreaId;
  category: CommunityCategory | "all";
  wheelchair: WheelchairStatus | "all";
  council: string;
  limit: number;
  offset: number;
  bbox?: [number, number, number, number];
};

export function parseCommunityQuery(params: URLSearchParams): CommunityQuery {
  const allowed = new Set([
    "area",
    "category",
    "wheelchair",
    "council",
    "limit",
    "offset",
    "bbox",
    "format",
  ]);
  for (const key of params.keys()) {
    if (!allowed.has(key) || params.getAll(key).length !== 1)
      throw new Error("Unknown or repeated query parameter");
  }
  const area = getCommunityArea(params.get("area") ?? "parramatta");
  const category = params.get("category") ?? "all";
  const wheelchair = params.get("wheelchair") ?? "all";
  const council = params.get("council") ?? "all";
  if (
    !area ||
    !["parking", "toilet", "public_space", "all"].includes(category) ||
    !["yes", "limited", "no", "designated", "unknown", "all"].includes(
      wheelchair,
    )
  )
    throw new Error("Invalid area or filter");
  if (council !== "all" && !getCouncilReference(council))
    throw new Error("Unknown council reference");
  const format = params.get("format");
  if (format !== null && format !== "geojson")
    throw new Error("Only GeoJSON is supported");
  const rawLimit = params.get("limit") ?? String(MAX_PUBLIC_FEATURES);
  const rawOffset = params.get("offset") ?? "0";
  if (!/^\d{1,3}$/.test(rawLimit) || !/^\d{1,6}$/.test(rawOffset))
    throw new Error("Invalid pagination");
  const limit = Number(rawLimit);
  const offset = Number(rawOffset);
  if (limit < 1 || limit > MAX_PUBLIC_FEATURES || offset > 100000)
    throw new Error("Pagination outside supported range");
  let bbox: CommunityQuery["bbox"];
  const rawBbox = params.get("bbox");
  if (rawBbox !== null) {
    const values = rawBbox.split(",");
    if (
      values.length !== 4 ||
      values.some((value) => !/^-?\d+(\.\d+)?$/.test(value))
    )
      throw new Error("Invalid bbox; use west,south,east,north");
    bbox = values.map(Number) as CommunityQuery["bbox"];
    const [west, south, east, north] = bbox!;
    const bounds = area.bbox;
    if (
      ![west, south, east, north].every(Number.isFinite) ||
      west >= east ||
      south >= north ||
      west < bounds[0] ||
      south < bounds[1] ||
      east > bounds[2] ||
      north > bounds[3]
    )
      throw new Error("Bbox must be inside the selected study window");
  }
  return {
    area: area.id,
    category: category as CommunityQuery["category"],
    wheelchair: wheelchair as CommunityQuery["wheelchair"],
    council,
    limit,
    offset,
    bbox,
  };
}

/** Immutable reviewed snapshot: public requests never fan out to Overpass or a participant database. */
export function getCommunityInfrastructure(
  query: CommunityQuery,
  snapshot: CommunitySnapshot = bundledSnapshot,
): CommunityInfrastructureCollection {
  const region = snapshot.areas[query.area];
  const matching = (region?.features ?? []).filter((feature) => {
    if (
      query.category !== "all" &&
      feature.properties.category !== query.category
    )
      return false;
    if (
      query.wheelchair !== "all" &&
      feature.properties.wheelchair !== query.wheelchair
    )
      return false;
    if (query.council !== "all") {
      const jurisdiction = feature.properties.councilJurisdiction;
      if (
        jurisdiction?.status !== "matched" ||
        !jurisdiction.matches.some((match) => match.councilId === query.council)
      )
        return false;
    }
    if (query.bbox) {
      const [lon, lat] = feature.geometry.coordinates;
      const [west, south, east, north] = query.bbox;
      if (lon < west || lon > east || lat < south || lat > north) return false;
    }
    return true;
  });
  const features = matching.slice(query.offset, query.offset + query.limit);
  return {
    type: "FeatureCollection",
    features,
    meta: {
      schemaVersion: "1.0.0",
      generatedAt: region?.retrievedAt ?? null,
      area: query.area,
      areas: COMMUNITY_AREAS,
      featureCount: features.length,
      totalMatched: matching.length,
      truncated: query.offset + features.length < matching.length,
      dataStatus: region ? "source_snapshot" : "not_loaded",
      claimState: "source_reported_not_independently_verified",
      evidenceScope:
        "Bounded OpenStreetMap facility display points; no independently assessed access or routing",
      liveNationalRouting: false,
      notice: COMMUNITY_NOTICE,
      attribution: `${OSM_ATTRIBUTION}; ${COUNCIL_BOUNDARY_SOURCE.attribution}`,
      councilLinkage: getCouncilLinkage(region?.features ?? []),
      sources: [
        {
          id: "openstreetmap",
          url: "https://www.openstreetmap.org/copyright",
          licence: "ODbL-1.0",
          licenceUrl: OSM_LICENCE_URL,
        },
        {
          id: COUNCIL_BOUNDARY_SOURCE.id,
          url: COUNCIL_BOUNDARY_SOURCE.url,
          licence: COUNCIL_BOUNDARY_SOURCE.licence,
          licenceUrl: COUNCIL_BOUNDARY_SOURCE.licenceUrl,
        },
      ],
    },
  };
}
