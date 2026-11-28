import type { GaisFeature } from "@/lib/gais/contracts/feature";
import { gaisFeatureToGeoJson } from "@/lib/gais/geojson/converters";

import {
  MAX_SOURCE_ELEMENTS,
  OSM_ATTRIBUTION,
  OSM_LICENCE_URL,
} from "./config";
import type {
  CommunityArea,
  CommunityCategory,
  CommunityInfrastructureFeature,
  WheelchairStatus,
} from "./types";

type OsmElement = {
  type: "node" | "way" | "relation";
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  timestamp?: string;
  version?: number;
  tags: Record<string, string>;
};

const LABELS: Record<string, string> = {
  wheelchair: "Wheelchair access reported",
  "wheelchair:description": "Wheelchair access notes",
  "wheelchair:description:en": "Wheelchair access notes (English)",
  access: "Access restriction",
  disabled: "Disability permit/access designation",
  opening_hours: "Opening hours (source text)",
  fee: "Fee",
  maxstay: "Maximum stay",
  operator: "Operator",
  parking_space: "Parking space designation",
  "capacity:disabled": "Designated disability spaces reported (not vacancy)",
  capacity: "Capacity reported (not vacancy)",
  surface: "Surface",
  smoothness: "Surface smoothness",
  width: "Width as tagged (not certified clear width)",
  "width:effective": "Effective width as tagged",
  incline: "Incline as tagged",
  maxheight: "Maximum height as tagged",
  kerb: "Kerb type",
  "kerb:height": "Kerb height as tagged",
  tactile_paving: "Tactile paving",
  lit: "Lighting",
  bench: "Seating",
  shelter: "Shelter",
  shade: "Shade",
  toilets: "Toilets reported",
  "toilets:wheelchair": "Toilet wheelchair access reported",
  "toilets:wheelchair:description": "Toilet wheelchair access notes",
  "toilets:wheelchair:door_width": "Toilet door width as tagged",
  "toilets:access": "Toilet access restriction",
  "toilets:opening_hours": "Toilet hours (source text)",
  "toilets:fee": "Toilet fee",
  "toilets:unisex": "Unisex toilets reported",
  unisex: "Unisex facility reported",
  changing_table: "Baby changing table reported",
  "changing_table:adult": "Adult changing table reported",
  "toilets:changing_table:adult": "Venue adult changing table reported",
  "toilets:position": "Toilet type/position",
  drinking_water: "Drinking water",
  indoor: "Indoors",
  level: "Level",
  entrance: "Entrance tag",
  door: "Door type",
  automatic_door: "Automatic door",
  description: "Source description",
};

const DATE_TAGS = [
  "check_date",
  "check_date:wheelchair",
  "check_date:toilets:wheelchair",
  "survey:date",
];
const ALLOWED_TAGS = new Set([
  "name",
  "name:en",
  "amenity",
  "leisure",
  "place",
  ...Object.keys(LABELS),
  ...DATE_TAGS,
]);

function cleanText(value: string, max = 1200): string {
  return value
    .replace(/[\u0000-\u001f\u007f]/g, " ")
    .slice(0, max)
    .trim();
}

export function sourceTags(raw: unknown): Record<string, string> {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
  const tags: Record<string, string> = {};
  for (const [key, value] of Object.entries(raw)) {
    if (ALLOWED_TAGS.has(key) && typeof value === "string")
      tags[key] = cleanText(value);
  }
  return tags;
}

function validPoint(lon: unknown, lat: unknown): lon is number {
  return (
    typeof lon === "number" &&
    Number.isFinite(lon) &&
    lon >= -180 &&
    lon <= 180 &&
    typeof lat === "number" &&
    Number.isFinite(lat) &&
    lat >= -90 &&
    lat <= 90
  );
}

function wheelchairStatus(value: string | undefined): WheelchairStatus {
  return value === "yes" ||
    value === "no" ||
    value === "limited" ||
    value === "designated"
    ? value
    : "unknown";
}

function classifications(
  tags: Record<string, string>,
): Array<{ category: CommunityCategory; kind: string; fallback: string }> {
  const results: Array<{
    category: CommunityCategory;
    kind: string;
    fallback: string;
  }> = [];
  const parking =
    tags.amenity === "parking" || tags.amenity === "parking_space";
  if (
    parking &&
    (tags.parking_space === "disabled" ||
      tags["capacity:disabled"] !== undefined ||
      ["yes", "designated"].includes(tags.disabled))
  ) {
    const individual = tags.amenity === "parking_space";
    const designated =
      tags.parking_space === "disabled" || tags.disabled === "designated";
    results.push({
      category: "parking",
      kind: individual
        ? designated
          ? "designated_parking_space"
          : "parking_space"
        : "parking_facility",
      fallback: individual
        ? designated
          ? "Designated disability parking space"
          : "Parking space with disability-access information"
        : "Parking facility with disability-space information",
    });
  }
  if (tags.amenity === "toilets" || tags.toilets === "yes") {
    results.push({
      category: "toilet",
      kind: tags.amenity === "toilets" ? "public_toilet" : "venue_toilet",
      fallback:
        tags.amenity === "toilets" ? "Toilet facility" : "Toilets at venue",
    });
  }
  if (
    ["park", "garden", "playground"].includes(tags.leisure) ||
    tags.place === "square"
  ) {
    results.push({
      category: "public_space",
      kind: tags.place === "square" ? "square" : tags.leisure,
      fallback: "Outdoor space",
    });
  }
  return results;
}

function validCalendarDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = Date.parse(`${value}T00:00:00.000Z`);
  // Date.parse rolls some invalid dates into the next month.
  return (
    Number.isFinite(parsed) &&
    new Date(parsed).toISOString().slice(0, 10) === value
  );
}

function validIsoTimestamp(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const match =
    /^(\d{4}-\d{2}-\d{2})T([01]\d|2[0-3]):([0-5]\d):([0-5]\d)(?:\.\d{1,3})?(?:Z|[+-](?:[01]\d|2[0-3]):[0-5]\d)$/.exec(
      value,
    );
  return match &&
    validCalendarDate(match[1]) &&
    Number.isFinite(Date.parse(value))
    ? value
    : null;
}

function checkDate(
  tags: Record<string, string>,
  isVenueToilet: boolean,
  retrievedAt: string,
): { checkedAt: string | null; checkedScope: string | null } {
  // These three study windows are in NSW. A local survey date may be the next
  // calendar day relative to UTC, so use Sydney's day when rejecting future dates.
  const parts = new Intl.DateTimeFormat("en-AU", {
    timeZone: "Australia/Sydney",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date(retrievedAt));
  const part = (name: string) =>
    parts.find((item) => item.type === name)?.value;
  const retrievalDay = `${part("year")}-${part("month")}-${part("day")}`;
  const keys = isVenueToilet
    ? ["check_date:toilets:wheelchair", "survey:date", "check_date"]
    : ["check_date:wheelchair", "survey:date", "check_date"];
  for (const key of keys) {
    const value = tags[key];
    if (value && validCalendarDate(value) && value <= retrievalDay) {
      return {
        checkedAt: value,
        checkedScope:
          key === "check_date"
            ? "existence only; access details not established"
            : key,
      };
    }
  }
  return { checkedAt: null, checkedScope: null };
}

/** Convert source claims to GAIS-compatible display points, never route endpoints. */
export function normaliseOsmElement(
  raw: unknown,
  area: CommunityArea,
  retrievedAt: string,
): CommunityInfrastructureFeature[] {
  if (!validIsoTimestamp(retrievedAt))
    throw new Error("Invalid retrieval time");
  if (!raw || typeof raw !== "object" || Array.isArray(raw))
    throw new Error("Malformed OSM element");
  const element = raw as OsmElement;
  if (
    !["node", "way", "relation"].includes(element.type) ||
    !Number.isSafeInteger(element.id) ||
    element.id < 1
  )
    throw new Error("Invalid OSM identity");
  const lon = element.type === "node" ? element.lon : element.center?.lon;
  const lat = element.type === "node" ? element.lat : element.center?.lat;
  if (!validPoint(lon, lat))
    throw new Error("Invalid or missing OSM display coordinates");
  const latitude = lat as number;
  const [west, south, east, north] = area.bbox;
  // A relation can intersect the query but have its representative centre outside it.
  if (lon < west || lon > east || latitude < south || latitude > north)
    return [];
  const tags = sourceTags(element.tags);
  const sourceId = `osm:${element.type}:${element.id}`;
  const geometryRole =
    element.type === "node" ? "mapped_point" : "approximate_bbox_centre";
  return classifications(tags).map(({ category, kind, fallback }) => {
    const id = `${sourceId}:${category}`;
    const isVenueToilet = kind === "venue_toilet";
    const named = cleanText(tags.name || tags["name:en"] || fallback, 200);
    const name = isVenueToilet ? `${named} — toilets (venue location)` : named;
    const wheelchair = wheelchairStatus(
      tags[isVenueToilet ? "toilets:wheelchair" : "wheelchair"],
    );
    const accessFacts = Object.entries(tags)
      .filter(([key]) => LABELS[key])
      .map(([key, value]) => ({
        key,
        label:
          isVenueToilet &&
          ["wheelchair", "opening_hours", "access", "fee"].includes(key)
            ? `Venue ${LABELS[key].toLowerCase()} (not toilet-specific)`
            : LABELS[key],
        value,
      }));
    const source = {
      id: sourceId,
      url: `https://www.openstreetmap.org/${element.type}/${element.id}`,
      licence: "ODbL-1.0" as const,
      licenceUrl: OSM_LICENCE_URL,
      attribution: OSM_ATTRIBUTION,
      retrievedAt,
      sourceUpdatedAt: validIsoTimestamp(element.timestamp),
      ...checkDate(tags, isVenueToilet, retrievedAt),
      osmVersion:
        Number.isSafeInteger(element.version) && (element.version ?? 0) > 0
          ? element.version!
          : null,
    };
    const gaisFeature: GaisFeature = {
      id,
      name,
      type: category === "toilet" ? "TOILET" : "PLACE",
      geometry: { type: "Point", coordinates: [lon, latitude] },
      properties: {
        category,
        facilityKind: kind,
        geometryRole,
        routeEndpoint: false,
        sourceUrl: source.url,
        sourceLicence: source.licence,
        retrievedAt,
        ...(source.sourceUpdatedAt
          ? { sourceUpdatedAt: source.sourceUpdatedAt }
          : {}),
        ...Object.fromEntries(
          Object.entries(tags).map(([key, value]) => [`osm:${key}`, value]),
        ),
      },
      evidence: [
        {
          id: sourceId,
          sourceType: "COMMUNITY_REPORTED",
          sourceLabel:
            "OpenStreetMap tag; not independently checked by MapAble",
        },
      ],
      // No feature-wide observedAt: source edit/retrieval/check dates have different scopes.
    };
    const projected = gaisFeatureToGeoJson(gaisFeature);
    const unknownAttributes = [
      ...(wheelchair === "unknown" ? ["Wheelchair access"] : []),
      ...(category === "parking"
        ? [
            "Current vacancy",
            "Ramp deployment and transfer clearance",
            "Usable path to entrance",
          ]
        : []),
      ...(category === "toilet"
        ? [
            "Current equipment operation",
            "Transfer space and direction",
            "Hoist availability",
          ]
        : []),
      ...(category === "public_space"
        ? ["Access along every internal path", "Current closures"]
        : []),
      "Independent MapAble assessment",
      "Accessible route connection",
    ];
    return {
      type: "Feature",
      id,
      geometry:
        gaisFeature.geometry as CommunityInfrastructureFeature["geometry"],
      properties: {
        ...projected.properties,
        id,
        name,
        area: area.id,
        category,
        facilityKind: kind,
        wheelchair,
        geometryRole,
        routeEndpoint: false,
        accessFacts,
        source,
        sourceTags: tags,
        knownAttributes: accessFacts.map(({ label, value }) => ({
          label,
          value,
        })),
        unknownAttributes,
      },
    };
  });
}

/** A failed or capped query must never silently become a successful empty refresh. */
export function normaliseOverpassResponse(
  raw: unknown,
  area: CommunityArea,
  retrievedAt: string,
) {
  if (!validIsoTimestamp(retrievedAt))
    throw new Error("Invalid retrieval time");
  if (!raw || typeof raw !== "object" || Array.isArray(raw))
    throw new Error("Invalid Overpass response");
  const data = raw as {
    elements?: unknown[];
    remark?: unknown;
    osm3s?: { timestamp_osm_base?: string };
  };
  if (data.remark)
    throw new Error("Overpass reported an incomplete or failed query");
  if (
    !Array.isArray(data.elements) ||
    data.elements.length > MAX_SOURCE_ELEMENTS
  )
    throw new Error("Overpass result missing or capped");
  const features = new Map<string, CommunityInfrastructureFeature>();
  for (const rawElement of data.elements) {
    for (const feature of normaliseOsmElement(rawElement, area, retrievedAt))
      features.set(feature.id, feature);
  }
  return {
    retrievedAt,
    osmBaseTimestamp: validIsoTimestamp(data.osm3s?.timestamp_osm_base),
    inputElementCount: data.elements.length,
    features: [...features.values()].sort((a, b) => a.id.localeCompare(b.id)),
  };
}
