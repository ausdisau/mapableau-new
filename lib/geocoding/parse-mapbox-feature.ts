import type { ReverseGeocodeResult } from "@/lib/geo";

/** Mapbox Geocoding API v5 feature (subset). */
export type MapboxGeocodeFeature = {
  id: string;
  place_name: string;
  text?: string;
  center: [number, number];
  place_type?: string[];
  context?: Array<{
    id: string;
    text: string;
    short_code?: string;
  }>;
  properties?: {
    postcode?: string;
    address?: string;
  };
};

export type ParsedMapboxPlace = {
  id: string;
  label: string;
  displayName: string;
  lat: number;
  lng: number;
  suburb: string;
  state: string;
  postcode: string;
};

function contextText(
  context: MapboxGeocodeFeature["context"],
  prefix: string,
): string {
  const item = context?.find((c) => c.id.startsWith(`${prefix}.`));
  return item?.text?.trim() ?? "";
}

function contextState(context: MapboxGeocodeFeature["context"]): string {
  const region = context?.find((c) => c.id.startsWith("region."));
  if (!region) return "";
  const code = region.short_code?.trim();
  if (code) {
    const stripped = code.replace(/^AU-/i, "");
    if (stripped.length <= 3) return stripped.toUpperCase();
  }
  return region.text?.trim() ?? "";
}

export function parseMapboxFeature(feature: MapboxGeocodeFeature): ParsedMapboxPlace {
  const [lng, lat] = feature.center;
  const suburb =
    contextText(feature.context, "locality") ||
    contextText(feature.context, "place") ||
    contextText(feature.context, "district") ||
    feature.text?.trim() ||
    "";
  const state = contextState(feature.context);
  const postcode =
    feature.properties?.postcode?.trim() ||
    contextText(feature.context, "postcode") ||
    "";

  return {
    id: feature.id,
    label: feature.place_name,
    displayName: feature.place_name,
    lat,
    lng,
    suburb,
    state,
    postcode,
  };
}

export function mapboxPlaceToReverseResult(place: ParsedMapboxPlace): ReverseGeocodeResult {
  return {
    postcode: place.postcode,
    suburb: place.suburb,
    state: place.state,
    displayName: place.displayName,
  };
}
