import { z } from "zod";

export const accessGeoAutocompleteQuerySchema = z.object({
  q: z.string().min(2).max(200),
  lat: z.coerce.number().min(-90).max(90).optional(),
  lng: z.coerce.number().min(-180).max(180).optional(),
});

export const accessGeoPlaceIdQuerySchema = z.object({
  placeId: z.string().min(1).max(500),
});

export const accessGeoGeocodeBodySchema = z.object({
  queryText: z.string().min(3).max(500),
  lat: z.number().min(-90).max(90).optional(),
  lng: z.number().min(-180).max(180).optional(),
});

export const accessGeoReverseBodySchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
});

export type AccessGeoAddress = {
  label: string;
  addressText: string;
  suburb?: string;
  stateOrRegion?: string;
  country: string;
  postalCode?: string;
};

export type AccessGeoCoordinates = {
  latitude: number;
  longitude: number;
};

export type AccessGeoSuggestion = {
  placeId: string;
  /** User-facing line — always Address.Label when available. */
  label: string;
  suburb?: string;
  stateOrRegion?: string;
};

export type AccessGeoPlaceDetails = AccessGeoAddress &
  AccessGeoCoordinates & {
    placeId: string;
  };
