/**
 * Public, provider-level map contract. Neither an NDIS directory record nor a
 * map pin is evidence of an individual worker's clearance or competency.
 */
export const CARE_MAP_LIMIT = 150;

export type CareMapBounds = {
  south: number;
  west: number;
  north: number;
  east: number;
};

export const DEFAULT_CARE_MAP_BOUNDS: CareMapBounds = {
  south: -34.15,
  west: 150.8,
  north: -33.55,
  east: 151.55,
};

export const CARE_MAP_CENTRES = {
  ALL: [-25.3, 133.7],
  NSW: [-33.8688, 151.2093],
  VIC: [-37.8136, 144.9631],
  QLD: [-27.4698, 153.0251],
  WA: [-31.9523, 115.8613],
  SA: [-34.9285, 138.6007],
  TAS: [-42.8821, 147.3272],
  ACT: [-35.2809, 149.13],
  NT: [-12.4634, 130.8456],
} as const satisfies Record<string, readonly [number, number]>;

export type CareMapRegion = keyof typeof CARE_MAP_CENTRES;
export type CareMapState = Exclude<CareMapRegion, "ALL">;

export type CareMapProvider = {
  id: string;
  name: string;
  suburb: string | null;
  state: string | null;
  postcode: string | null;
  lat: number;
  lng: number;
  abn: string | null;
  phone: string | null;
  website: string | null;
  registrationGroups: string[];
  sourceUpdatedAt: string | null;
  importedRecordAt: string;
};

export type CareMapResponse = {
  providers: CareMapProvider[];
  count: number;
  moreAvailable: boolean;
  source: "ndis_provider_finder_import";
  sourceUrl: string;
  importedAt: string;
  staleImport: boolean;
};

export type CareMapDirectoryRow = {
  sourceId: string;
  providerName: string;
  suburb: string | null;
  state: string | null;
  postcode: string | null;
  latitude: number | null;
  longitude: number | null;
  abn: string | null;
  phone: string | null;
  website: string | null;
  registrationGroups: string[];
  sourceUpdatedAt: Date | null;
  updatedAt: Date;
};

export function isValidCareMapBounds(bounds: CareMapBounds): boolean {
  return (
    Object.values(bounds).every(Number.isFinite) &&
    bounds.south >= -90 &&
    bounds.north <= 90 &&
    bounds.west >= -180 &&
    bounds.east <= 180 &&
    bounds.south < bounds.north &&
    bounds.west < bounds.east
  );
}

/** Includes the mainland, Tasmania and external territories; excludes (0,0). */
export function isPlausibleAustralianCoordinate(
  lat: number,
  lng: number,
): boolean {
  return (
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    lat >= -56 &&
    lat <= -9 &&
    lng >= 95 &&
    lng <= 170
  );
}

export function safeCareProviderWebsite(raw: string | null): string | null {
  if (!raw?.trim()) return null;
  const value = raw.trim();
  try {
    const url = new URL(
      /^https?:\/\//i.test(value) ? value : "https://" + value,
    );
    if (
      !["http:", "https:"].includes(url.protocol) ||
      !url.hostname.includes(".") ||
      url.username ||
      url.password
    ) {
      return null;
    }
    return url.toString();
  } catch {
    return null;
  }
}

export function toCareMapProvider(
  row: CareMapDirectoryRow,
): CareMapProvider | null {
  if (
    row.latitude == null ||
    row.longitude == null ||
    !isPlausibleAustralianCoordinate(row.latitude, row.longitude) ||
    !row.providerName.trim() ||
    row.providerName.trim().toLowerCase() === "unknown provider"
  ) {
    return null;
  }
  return {
    id: row.sourceId,
    name: row.providerName.trim(),
    suburb: row.suburb,
    state: row.state,
    postcode: row.postcode,
    lat: row.latitude,
    lng: row.longitude,
    abn: row.abn,
    phone: row.phone,
    website: safeCareProviderWebsite(row.website),
    registrationGroups: row.registrationGroups,
    sourceUpdatedAt: row.sourceUpdatedAt?.toISOString() ?? null,
    importedRecordAt: row.updatedAt.toISOString(),
  };
}
