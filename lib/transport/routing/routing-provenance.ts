import type {
  RouteEstimateResult,
  RoutingProviderStatus,
  RoutingSource,
  RoutingTrafficMode,
} from "@/types/transport-routing";

const DEFAULT_TTL_MS = 15 * 60 * 1000;
const LIVE_TTL_MS = 3 * 60 * 1000;

export function estimateTtlMs(liveTrafficUsed: boolean): number {
  return liveTrafficUsed ? LIVE_TTL_MS : DEFAULT_TTL_MS;
}

export function finalizeRouteEstimate(
  input: {
    distanceMetres: number;
    durationSeconds: number;
    segments?: RouteEstimateResult["segments"];
    geometry?: RouteEstimateResult["geometry"];
    source: RoutingSource;
    trafficModeApplied: RoutingTrafficMode;
    liveTrafficUsed: boolean;
    providerStatus?: RoutingProviderStatus;
    fallbackReason?: string;
    generatedAt?: string;
    validUntil?: string;
    raw?: unknown;
  }
): RouteEstimateResult {
  const generatedAt = input.generatedAt ?? new Date().toISOString();
  const validUntil =
    input.validUntil ??
    new Date(
      Date.parse(generatedAt) + estimateTtlMs(input.liveTrafficUsed)
    ).toISOString();

  return {
    distanceMetres: input.distanceMetres,
    durationSeconds: input.durationSeconds,
    travelDurationSeconds: input.durationSeconds,
    segments: input.segments,
    geometry: input.geometry,
    source: input.source,
    trafficModeApplied: input.trafficModeApplied,
    liveTrafficUsed: input.liveTrafficUsed,
    providerStatus: input.providerStatus ?? "ok",
    fallbackReason: input.fallbackReason,
    generatedAt,
    validUntil,
    advisoryOnly: true,
    raw: input.raw,
  };
}

export function redactRoutingRaw(raw: unknown): unknown {
  if (raw == null) return undefined;
  try {
    const text = JSON.stringify(raw);
    const redacted = text
      .replace(/("key"\s*:\s*")[^"]*(")/gi, "$1[redacted]$2")
      .replace(/([?&]key=)[^&"]+/gi, "$1[redacted]")
      .replace(/("TomTom-Api-Key"\s*:\s*")[^"]*(")/gi, "$1[redacted]$2");
    return JSON.parse(redacted) as unknown;
  } catch {
    return { redacted: true };
  }
}
