import { phase3Config } from "@/lib/config/phase3";
import { phase5Config } from "@/lib/config/phase5";

/** Transport route planning and optimisation (session/booking scoped). */
export function isDynamicRoutingEnabled(): boolean {
  return (
    phase3Config.transportRoutingEnabled ||
    phase5Config.routeOptimisationEnabled
  );
}

export function getRouteProviderLabel(): string {
  if (phase5Config.routeProvider && phase5Config.routeProvider !== "disabled") {
    return phase5Config.routeProvider;
  }
  if (isDynamicRoutingEnabled()) {
    return "haversine";
  }
  return "disabled";
}
