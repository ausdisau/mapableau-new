import type { TransportRoutingProvider } from "@prisma/client";

function envTrue(name: string): boolean {
  return process.env[name] === "true";
}

function envInt(name: string, fallback: number): number {
  const raw = process.env[name];
  if (!raw) return fallback;
  const n = Number(raw);
  return Number.isFinite(n) ? n : fallback;
}

export const transportRoutingConfig = {
  get provider(): TransportRoutingProvider {
    return (process.env.TRANSPORT_ROUTING_PROVIDER ??
      "mock") as TransportRoutingProvider;
  },
  get osrmBaseUrl() {
    return process.env.OSRM_BASE_URL ?? "http://router.project-osrm.org";
  },
  get graphhopperApiKey() {
    return process.env.GRAPHHOPPER_API_KEY;
  },
  get openRouteServiceApiKey() {
    return process.env.OPENROUTESERVICE_API_KEY;
  },
  get tomtomApiKey() {
    return process.env.TOMTOM_API_KEY?.trim() || undefined;
  },
  get routingEnabled() {
    return envTrue("TRANSPORT_ROUTING_ENABLED");
  },
  get etaPilotEnabled() {
    return envTrue("TRANSPORT_ETA_PILOT_ENABLED");
  },
  get trafficAwareEnabled() {
    return envTrue("TRANSPORT_TRAFFIC_AWARE_ENABLED");
  },
  get tomtomTrafficLive() {
    return envTrue("TRANSPORT_TOMTOM_TRAFFIC_LIVE");
  },
  get tomtomDailyRequestCap() {
    return envInt("TRANSPORT_TOMTOM_DAILY_REQUEST_CAP", 200);
  },
  get tomtomMaxWaypoints() {
    return envInt("TRANSPORT_TOMTOM_MAX_WAYPOINTS", 20);
  },
  get boardingBufferSeconds() {
    return envInt("TRANSPORT_BOARDING_BUFFER_SECONDS", 600);
  },
  get extraBoardingBufferSeconds() {
    return envInt("TRANSPORT_EXTRA_BOARDING_BUFFER_SECONDS", 600);
  },
};

export function isTomTomLiveTrafficAllowed(): boolean {
  return (
    transportRoutingConfig.trafficAwareEnabled &&
    transportRoutingConfig.tomtomTrafficLive &&
    Boolean(transportRoutingConfig.tomtomApiKey)
  );
}

export function isPublicOsrmDemo(
  baseUrl = transportRoutingConfig.osrmBaseUrl
): boolean {
  try {
    const host = new URL(baseUrl).hostname.toLowerCase();
    return host === "router.project-osrm.org" || host.endsWith(".project-osrm.org");
  } catch {
    return true;
  }
}

export function shouldBlockPublicOsrmFallback(params?: {
  sensitiveOrigin?: boolean;
  nodeEnv?: string;
  baseUrl?: string;
}): boolean {
  if (!isPublicOsrmDemo(params?.baseUrl)) return false;
  const nodeEnv = params?.nodeEnv ?? process.env.NODE_ENV;
  return nodeEnv === "production" || Boolean(params?.sensitiveOrigin);
}
