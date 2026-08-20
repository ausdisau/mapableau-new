import {
  ALLOWED_EXTERNAL_CATEGORY_TAXONOMY,
  ALLOWED_EXTERNAL_REGION_CODES,
  SENSITIVE_AD_CONTEXT_KEYS,
} from "@/lib/ads/privacy/sensitive-keys";
import type {
  ExternalAdContext,
  InternalAdContext,
  ZoomBand,
} from "@/lib/ads/types";

function allowlistValue<T extends string>(
  value: string | undefined,
  allowed: readonly T[],
): T | undefined {
  if (!value) return undefined;
  const normalised = value.trim().toLowerCase().replace(/\s+/g, "_");
  return (allowed as readonly string[]).includes(normalised)
    ? (normalised as T)
    : undefined;
}

export function zoomToBand(zoom: number | undefined): ZoomBand | undefined {
  if (zoom == null || !Number.isFinite(zoom)) return undefined;
  if (zoom < 8) return "national";
  if (zoom < 11) return "region";
  if (zoom < 14) return "local";
  return "street";
}

/**
 * Convert precise InternalAdContext to allowlisted ExternalAdContext.
 * Allowlist-only — unknown fields and sensitive keys are omitted.
 */
export function sanitizeExternalAdContext(
  internal: InternalAdContext,
  extra?: Record<string, unknown>,
): ExternalAdContext {
  if (extra) {
    for (const key of Object.keys(extra)) {
      if (
        (SENSITIVE_AD_CONTEXT_KEYS as readonly string[]).includes(key) ||
        /ndis|disability|diagnosis|medical|clinical|participant/i.test(key)
      ) {
        // Explicitly drop — never forward.
        continue;
      }
    }
  }

  const surface =
    internal.surface === "provider_finder" ? "provider_finder" : "access";

  return {
    surface,
    placement: internal.placement,
    regionCode: allowlistValue(
      internal.regionCode,
      ALLOWED_EXTERNAL_REGION_CODES,
    ),
    category: allowlistValue(
      internal.category,
      ALLOWED_EXTERNAL_CATEGORY_TAXONOMY,
    ),
    zoomBand: internal.zoomBand ?? zoomToBand(internal.zoom),
  };
}

/** Runtime guard: assert an object has no sensitive keys. */
export function assertNoSensitiveExternalKeys(
  context: Record<string, unknown>,
): string[] {
  const leaked: string[] = [];
  for (const key of Object.keys(context)) {
    if ((SENSITIVE_AD_CONTEXT_KEYS as readonly string[]).includes(key)) {
      leaked.push(key);
    }
  }
  return leaked;
}
