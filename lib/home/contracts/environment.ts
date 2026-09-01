import type { HomeCapabilityKind } from "./capability";
import type { HomePrivacyZone } from "./privacy";
import type { StateConfidence } from "./state";

export const HOME_ENDPOINT_CATEGORIES = [
  "LIGHT",
  "LOCK",
  "DOOR",
  "COVERING",
  "THERMOSTAT",
  "INTERCOM",
  "BED",
  "CHARGER",
  "LIFT",
  "MEDIA",
  "SENSOR",
  "OTHER",
] as const;

export type HomeEndpointCategory = (typeof HOME_ENDPOINT_CATEGORIES)[number];

export type HomeZone = {
  id: string;
  environmentId: string;
  displayName: string;
  privacyZone: HomePrivacyZone;
};

export type HomeEndpoint = {
  id: string;
  adapterId: string;
  environmentId: string;
  zoneId: string;
  displayName: string;
  category: HomeEndpointCategory;
  capabilities: HomeCapabilityKind[];
  availability: "AVAILABLE" | "UNAVAILABLE" | "UNKNOWN";
  stateConfidence: StateConfidence;
  lastObservedAt: string | null;
  vendorRef?: string;
};

export type HomeEnvironment = {
  id: string;
  displayName: string;
  adapterId: string;
  zones: HomeZone[];
  endpoints: HomeEndpoint[];
  claimState: "SIMULATION" | "SCAFFOLD" | "PROPOSED";
};
