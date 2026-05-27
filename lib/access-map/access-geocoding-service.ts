import type {
  Address,
  AutocompleteResultItem,
  GeocodeResultItem,
  GetPlaceCommandOutput,
  ReverseGeocodeResultItem,
} from "@aws-sdk/client-geo-places";
import {
  amazonAutocomplete,
  amazonGeocode,
  amazonGetPlace,
  amazonReverseGeocode,
  parseAmazonAddress,
  positionToLatLng,
} from "@/lib/amazon-location/geo-places-client";
import { isAmazonLocationEnabled } from "@/lib/amazon-location/config";
import type { CreateAccessPlaceInput } from "@/types/access-map";
import type {
  AccessGeoPlaceDetails,
  AccessGeoSuggestion,
} from "@/types/access-geo";

function suggestionFromAutocompleteItem(
  item: AutocompleteResultItem
): AccessGeoSuggestion | null {
  if (!item.PlaceId) return null;
  const parsed = parseAmazonAddress(item.Address);
  const label = parsed.label || item.Title || item.PlaceId;
  return {
    placeId: item.PlaceId,
    label,
    suburb: parsed.suburb,
    stateOrRegion: parsed.stateOrRegion,
  };
}

type PlaceResultLike =
  | GetPlaceCommandOutput
  | GeocodeResultItem
  | ReverseGeocodeResultItem;

function detailsFromPlaceResult(item: PlaceResultLike): AccessGeoPlaceDetails | null {
  if (!item.PlaceId) return null;

  const coords = positionToLatLng(item.Position);
  if (!coords) return null;

  const parsed = parseAmazonAddress(item.Address as Address | undefined);
  const label = parsed.label || "";
  if (!label) return null;

  return {
    placeId: item.PlaceId,
    label,
    addressText: label,
    suburb: parsed.suburb,
    stateOrRegion: parsed.stateOrRegion,
    country: parsed.country,
    postalCode: parsed.postalCode,
    latitude: coords.latitude,
    longitude: coords.longitude,
  };
}

export function isAccessGeocodingAvailable(): boolean {
  return isAmazonLocationEnabled();
}

export async function accessGeoAutocomplete(
  query: string,
  bias?: { latitude: number; longitude: number }
): Promise<AccessGeoSuggestion[]> {
  const items = await amazonAutocomplete({
    queryText: query.trim(),
    lat: bias?.latitude,
    lng: bias?.longitude,
  });
  return items
    .map(suggestionFromAutocompleteItem)
    .filter((s): s is AccessGeoSuggestion => s != null);
}

export async function accessGeoResolvePlace(
  placeId: string
): Promise<AccessGeoPlaceDetails | null> {
  const place = await amazonGetPlace(placeId);
  if (!place) return null;
  return detailsFromPlaceResult(place);
}

export async function accessGeoGeocodeAddress(queryText: string): Promise<AccessGeoPlaceDetails | null> {
  const items = await amazonGeocode({ queryText: queryText.trim(), maxResults: 1 });
  const first = items[0];
  if (!first) return null;
  return detailsFromPlaceResult(first);
}

export async function accessGeoReverseGeocode(
  latitude: number,
  longitude: number
): Promise<AccessGeoPlaceDetails | null> {
  const items = await amazonReverseGeocode({ latitude, longitude, maxResults: 1 });
  const first = items[0];
  if (!first) return null;
  return detailsFromPlaceResult(first);
}

/** Fill missing coordinates on create when user supplied address text only. */
export async function accessGeoEnrichCreateInput(
  input: CreateAccessPlaceInput
): Promise<CreateAccessPlaceInput> {
  if (!isAccessGeocodingAvailable()) return input;

  const hasCoords =
    Number.isFinite(input.latitude) &&
    Number.isFinite(input.longitude) &&
    !(input.latitude === 0 && input.longitude === 0);

  if (hasCoords) return input;

  const query = [input.addressText, input.suburb, input.stateOrRegion, "Australia"]
    .filter(Boolean)
    .join(", ");
  if (query.length < 5) return input;

  const resolved = await accessGeoGeocodeAddress(query);
  if (!resolved) return input;

  return {
    ...input,
    addressText: input.addressText ?? resolved.addressText,
    suburb: input.suburb ?? resolved.suburb,
    stateOrRegion: input.stateOrRegion ?? resolved.stateOrRegion,
    latitude: resolved.latitude,
    longitude: resolved.longitude,
  };
}
