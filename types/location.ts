export type UserLocationSource = "browser_geolocation" | "manual_search";

export type UserLocation = {
  latitude: number;
  longitude: number;
  accuracy?: number;
  source: UserLocationSource;
  capturedAt: string;
};

export type GeolocationStatus =
  | "idle"
  | "requesting"
  | "granted"
  | "denied"
  | "unavailable"
  | "timeout"
  | "error";

export type GeolocationErrorCode =
  | "PERMISSION_DENIED"
  | "POSITION_UNAVAILABLE"
  | "TIMEOUT"
  | "UNSUPPORTED"
  | "UNKNOWN";

export type ProviderDistanceKind = "exact" | "approximate" | "service_area" | "unknown";

export type ProviderDistanceResult = {
  providerId: string;
  distanceKm: number | null;
  kind: ProviderDistanceKind;
  label: string;
};

export const RADIUS_KM_OPTIONS = [5, 10, 25, 50, 100] as const;
export type RadiusKmOption = (typeof RADIUS_KM_OPTIONS)[number];

export const DEFAULT_RADIUS_KM: RadiusKmOption = 25;
