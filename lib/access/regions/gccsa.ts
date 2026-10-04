export const ABS_GCCSA_2026_SERVICE_URL =
  "https://geo.abs.gov.au/arcgis/rest/services/ASGS2026/GCCSA/MapServer";

export const ABS_GCCSA_2026_REFERENCE_URL =
  "https://www.abs.gov.au/statistics/standards/australian-statistical-geography-standard-asgs/edition-4-july-2026-june-2031/access-and-downloads/geospatial-web-services";

export type AccessCapitalRegionSlug =
  | "sydney"
  | "melbourne"
  | "brisbane"
  | "adelaide"
  | "perth"
  | "hobart"
  | "darwin"
  | "canberra";

export type AccessCapitalRegion = {
  slug: AccessCapitalRegionSlug;
  gccsaCode: string;
  absName: string;
  displayName: string;
  stateOrTerritory: string;
  view: {
    latitude: number;
    longitude: number;
    zoom: number;
  };
};

export const ACCESS_CAPITAL_REGIONS: readonly AccessCapitalRegion[] = [
  {
    slug: "sydney",
    gccsaCode: "1GSYD",
    absName: "Greater Sydney",
    displayName: "Sydney",
    stateOrTerritory: "NSW",
    view: { latitude: -33.8688, longitude: 151.2093, zoom: 8.1 },
  },
  {
    slug: "melbourne",
    gccsaCode: "2GMEL",
    absName: "Greater Melbourne",
    displayName: "Melbourne",
    stateOrTerritory: "VIC",
    view: { latitude: -37.8136, longitude: 144.9631, zoom: 8.1 },
  },
  {
    slug: "brisbane",
    gccsaCode: "3GBRI",
    absName: "Greater Brisbane",
    displayName: "Brisbane",
    stateOrTerritory: "QLD",
    view: { latitude: -27.4698, longitude: 153.0251, zoom: 8.2 },
  },
  {
    slug: "adelaide",
    gccsaCode: "4GADE",
    absName: "Greater Adelaide",
    displayName: "Adelaide",
    stateOrTerritory: "SA",
    view: { latitude: -34.9285, longitude: 138.6007, zoom: 8.5 },
  },
  {
    slug: "perth",
    gccsaCode: "5GPER",
    absName: "Greater Perth",
    displayName: "Perth",
    stateOrTerritory: "WA",
    view: { latitude: -31.9523, longitude: 115.8613, zoom: 8.2 },
  },
  {
    slug: "hobart",
    gccsaCode: "6GHOB",
    absName: "Greater Hobart",
    displayName: "Hobart",
    stateOrTerritory: "TAS",
    view: { latitude: -42.8821, longitude: 147.3272, zoom: 9 },
  },
  {
    slug: "darwin",
    gccsaCode: "7GDAR",
    absName: "Greater Darwin",
    displayName: "Darwin",
    stateOrTerritory: "NT",
    view: { latitude: -12.4634, longitude: 130.8456, zoom: 9 },
  },
  {
    slug: "canberra",
    gccsaCode: "8ACTE",
    absName: "Australian Capital Territory",
    displayName: "Canberra / ACT",
    stateOrTerritory: "ACT",
    view: { latitude: -35.2809, longitude: 149.13, zoom: 9 },
  },
] as const;

export type GccsaBoundaryGeometry = {
  type: "Polygon" | "MultiPolygon";
  coordinates: unknown;
};

export type GccsaBoundaryFeature = {
  type: "Feature";
  id?: string | number;
  geometry: GccsaBoundaryGeometry;
  properties: {
    mapableSlug: AccessCapitalRegionSlug;
    gccsaCode: string;
    gccsaName: string;
    stateName: string | null;
    areaSqKm: number | null;
    source: "abs_asgs_2026";
  };
};

export type GccsaBoundaryFeatureCollection = {
  type: "FeatureCollection";
  features: GccsaBoundaryFeature[];
};

export type GccsaBoundaryApiResponse = {
  boundary: GccsaBoundaryFeatureCollection;
  source: {
    custodian: "Australian Bureau of Statistics";
    dataset: "ASGS Edition 4 Greater Capital City Statistical Areas";
    referenceYear: 2026;
    licence: "CC BY 4.0";
    serviceUrl: string;
    referenceUrl: string;
  };
  status: {
    expectedRegions: 8;
    receivedRegions: number;
    complete: boolean;
  };
};

const REGIONS_BY_CODE = new Map(
  ACCESS_CAPITAL_REGIONS.map((region) => [region.gccsaCode, region]),
);

const REGIONS_BY_NAME = new Map(
  ACCESS_CAPITAL_REGIONS.map((region) => [region.absName.toLowerCase(), region]),
);

export function isAccessCapitalRegionSlug(
  value: string | null | undefined,
): value is AccessCapitalRegionSlug {
  return ACCESS_CAPITAL_REGIONS.some((region) => region.slug === value);
}

export function getCapitalRegionBySlug(
  slug: AccessCapitalRegionSlug,
): AccessCapitalRegion {
  return ACCESS_CAPITAL_REGIONS.find((region) => region.slug === slug)!;
}

function readString(
  properties: Record<string, unknown>,
  ...keys: string[]
): string {
  for (const key of keys) {
    const value = properties[key];
    if (typeof value === "string") return value;
  }
  return "";
}

function readNumber(
  properties: Record<string, unknown>,
  ...keys: string[]
): number | null {
  for (const key of keys) {
    const value = properties[key];
    if (typeof value === "number" && Number.isFinite(value)) return value;
  }
  return null;
}

export function normalizeAbsGccsaGeoJson(
  raw: unknown,
): GccsaBoundaryFeatureCollection {
  if (!raw || typeof raw !== "object") {
    return { type: "FeatureCollection", features: [] };
  }

  const candidate = raw as {
    features?: Array<{
      id?: string | number;
      geometry?: { type?: string; coordinates?: unknown };
      properties?: Record<string, unknown>;
    }>;
  };

  if (!Array.isArray(candidate.features)) {
    return { type: "FeatureCollection", features: [] };
  }

  const features: GccsaBoundaryFeature[] = [];

  for (const feature of candidate.features) {
    const properties = feature.properties ?? {};
    const code = readString(
      properties,
      "gccsa_code_2026",
      "GCCSA_CODE_2026",
    );
    const name = readString(
      properties,
      "gccsa_name_2026",
      "GCCSA_NAME_2026",
    );
    const region =
      REGIONS_BY_CODE.get(code) ?? REGIONS_BY_NAME.get(name.toLowerCase());

    if (!region) continue;
    if (
      feature.geometry?.type !== "Polygon" &&
      feature.geometry?.type !== "MultiPolygon"
    ) {
      continue;
    }

    features.push({
      type: "Feature",
      id: feature.id ?? region.gccsaCode,
      geometry: {
        type: feature.geometry.type,
        coordinates: feature.geometry.coordinates,
      },
      properties: {
        mapableSlug: region.slug,
        gccsaCode: region.gccsaCode,
        gccsaName: name || region.absName,
        stateName:
          readString(properties, "state_name_2026", "STATE_NAME_2026") || null,
        areaSqKm: readNumber(
          properties,
          "area_albers_sqkm",
          "AREA_ALBERS_SQKM",
        ),
        source: "abs_asgs_2026",
      },
    });
  }

  return {
    type: "FeatureCollection",
    features,
  };
}
