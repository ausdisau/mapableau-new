import { phase3Config } from "@/lib/config/phase3";
import { phase5Config } from "@/lib/config/phase5";

export function isDynamicRoutingEnabled() {
  return (
    phase3Config.transportRoutingEnabled ||
    phase5Config.routeOptimisationEnabled
  );
}

export function getRouteProviderLabel() {
  if (phase5Config.routeProvider && phase5Config.routeProvider !== "disabled") {
    return phase5Config.routeProvider;
  }
  return isDynamicRoutingEnabled() ? "haversine" : "disabled";
}
