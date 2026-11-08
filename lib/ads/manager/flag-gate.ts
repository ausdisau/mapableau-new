import { adsFlagsConfig } from "@/lib/ads/config/flags";
import { jsonError } from "@/lib/api/response";

export function managerDisabledResponse() {
  return jsonError("Ads manager is disabled", 404);
}

export function placementApiDisabledResponse() {
  return jsonError("Placement API is disabled", 404);
}

export function assertManagerEnabled() {
  return adsFlagsConfig.isManagerEnabled();
}

export function assertPlacementApiEnabled() {
  return adsFlagsConfig.isPlacementApiEnabled();
}
