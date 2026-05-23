import { transportOsmConfig } from "@/lib/transport-osm/config";

import { OpenRouteServiceProvider } from "./openrouteservice-provider";
import { OpenTripPlannerRoutingProvider } from "./opentripplanner-provider";
import { PlaceholderRoutingProvider } from "./placeholder-provider";
import type { RoutingProvider } from "./types";
import { ValhallaRoutingProvider } from "./valhalla-provider";

let cached: RoutingProvider | null = null;

export function getRoutingProvider(): RoutingProvider {
  if (cached) return cached;
  const provider = transportOsmConfig.routeProvider;
  if (provider === "openrouteservice" && transportOsmConfig.orsApiKey) {
    cached = new OpenRouteServiceProvider();
  } else if (provider === "valhalla") {
    cached = new ValhallaRoutingProvider();
  } else if (provider === "opentripplanner") {
    cached = new OpenTripPlannerRoutingProvider();
  } else {
    cached = new PlaceholderRoutingProvider();
  }
  return cached;
}

export * from "./types";
