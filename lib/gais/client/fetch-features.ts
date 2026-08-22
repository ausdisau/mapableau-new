import type { GaisGeoJsonFeature } from "@/lib/gais/geojson/converters";

export type GaisBoundsInput = {
  minLat: number;
  minLng: number;
  maxLat: number;
  maxLng: number;
  limit?: number;
};

export type GaisFeaturesResponse = {
  type: "FeatureCollection";
  features: GaisGeoJsonFeature[];
  meta: {
    claimState: string;
    evidenceScope: string;
    generatedAt: string;
    liveNationalRouting: false;
    featureCount: number;
  };
};

export function boundsToSearchParams(bounds: GaisBoundsInput): URLSearchParams {
  const params = new URLSearchParams();
  params.set("minLat", String(bounds.minLat));
  params.set("minLng", String(bounds.minLng));
  params.set("maxLat", String(bounds.maxLat));
  params.set("maxLng", String(bounds.maxLng));
  if (bounds.limit != null) params.set("limit", String(bounds.limit));
  return params;
}

export async function fetchGaisFeaturesInBounds(
  bounds: GaisBoundsInput,
  signal?: AbortSignal,
): Promise<GaisFeaturesResponse> {
  const params = boundsToSearchParams(bounds);
  const res = await fetch(`/api/gais/features?${params.toString()}`, { signal });
  if (!res.ok) {
    throw new Error(`GAIS features request failed (${res.status})`);
  }
  return res.json() as Promise<GaisFeaturesResponse>;
}

/** Client-side result cap for map rendering performance. */
export const GAIS_CLIENT_FEATURE_LIMIT = 200;
