import {
  AutocompleteCommand,
  GeoPlacesClient,
  GeocodeCommand,
  GetPlaceCommand,
  ReverseGeocodeCommand,
} from "@aws-sdk/client-geo-places";
import type {
  Address,
  AutocompleteCommandInput,
  GeocodeCommandInput,
  GetPlaceCommandInput,
  ReverseGeocodeCommandInput,
} from "@aws-sdk/client-geo-places";

import {
  getAmazonLocationConfig,
  isAmazonLocationEnabled,
} from "@/lib/amazon-location/config";

let client: GeoPlacesClient | null = null;

function getClient(): GeoPlacesClient {
  if (!client) {
    const { region } = getAmazonLocationConfig();
    client = new GeoPlacesClient({ region });
  }
  return client;
}

function withApiKey<T extends { Key?: string | undefined }>(input: T): T {
  const { apiKey } = getAmazonLocationConfig();
  if (!apiKey) return input;
  return { ...input, Key: apiKey };
}

function biasPosition(lat?: number, lng?: number): [number, number] | undefined {
  if (lat != null && lng != null) return [lng, lat];
  return getAmazonLocationConfig().defaultBiasPosition;
}

function auFilter() {
  return {
    IncludeCountries: getAmazonLocationConfig().includeCountries,
  };
}

export function parseAmazonAddress(address?: Address): {
  label: string;
  suburb?: string;
  stateOrRegion?: string;
  country: string;
  postalCode?: string;
} {
  const label = address?.Label?.trim() ?? "";
  const country = address?.Country?.Code2 ?? address?.Country?.Code3 ?? "AU";
  return {
    label,
    suburb: address?.Locality ?? address?.District ?? undefined,
    stateOrRegion: address?.Region?.Name ?? address?.Region?.Code ?? undefined,
    country,
    postalCode: address?.PostalCode ?? undefined,
  };
}

export function positionToLatLng(
  position?: number[]
): { latitude: number; longitude: number } | null {
  if (!position || position.length < 2) return null;
  const [lng, lat] = position;
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return { latitude: lat, longitude: lng };
}

export async function amazonAutocomplete(params: {
  queryText: string;
  maxResults?: number;
  lat?: number;
  lng?: number;
}) {
  if (!isAmazonLocationEnabled()) return [];

  const { language } = getAmazonLocationConfig();
  const input: AutocompleteCommandInput = {
    QueryText: params.queryText,
    MaxResults: params.maxResults ?? 8,
    Language: language,
    BiasPosition: biasPosition(params.lat, params.lng),
    Filter: auFilter(),
  };
  const res = await getClient().send(new AutocompleteCommand(withApiKey(input)));

  return res.ResultItems ?? [];
}

export async function amazonGeocode(params: {
  queryText: string;
  lat?: number;
  lng?: number;
  maxResults?: number;
}) {
  if (!isAmazonLocationEnabled()) return [];

  const { language } = getAmazonLocationConfig();
  const input: GeocodeCommandInput = {
    QueryText: params.queryText,
    MaxResults: params.maxResults ?? 1,
    Language: language,
    BiasPosition: biasPosition(params.lat, params.lng),
    Filter: auFilter(),
  };
  const res = await getClient().send(new GeocodeCommand(withApiKey(input)));

  return res.ResultItems ?? [];
}

export async function amazonGetPlace(placeId: string) {
  if (!isAmazonLocationEnabled()) return null;

  const { language } = getAmazonLocationConfig();
  const input: GetPlaceCommandInput = {
    PlaceId: placeId,
    Language: language,
  };
  return getClient().send(new GetPlaceCommand(withApiKey(input)));
}

export async function amazonReverseGeocode(params: {
  latitude: number;
  longitude: number;
  maxResults?: number;
}) {
  if (!isAmazonLocationEnabled()) return [];

  const { language } = getAmazonLocationConfig();
  const input: ReverseGeocodeCommandInput = {
    QueryPosition: [params.longitude, params.latitude],
    MaxResults: params.maxResults ?? 1,
    Language: language,
    QueryRadius: 100,
  };
  const res = await getClient().send(new ReverseGeocodeCommand(withApiKey(input)));

  return res.ResultItems ?? [];
}
