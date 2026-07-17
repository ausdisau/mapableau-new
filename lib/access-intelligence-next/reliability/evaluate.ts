import { getHarbourReliabilityProfiles } from "./harbour-profiles";
import type {
  AccessReliabilityBand,
  AccessReliabilityProfile,
  AccessReliabilityScanResult,
} from "./types";

const BAND_ORDER: AccessReliabilityBand[] = [
  "cannot_forecast",
  "insufficient_evidence",
  "historically_unreliable",
  "mixed",
  "generally_reliable",
];

/**
 * Deterministic reliability scan for a place.
 * Synthetic Harbour Civic only in this wave — no live sensors, no fabricated probabilities.
 */
export function scanPlaceReliability(placeRef: string): AccessReliabilityScanResult {
  const normalised = placeRef.trim().toLowerCase();
  const profiles =
    normalised === "harbour_civic" || normalised.startsWith("harbour_civic.")
      ? getHarbourReliabilityProfiles()
      : [];

  return {
    placeRef: placeRef.trim() || "harbour_civic",
    scannedAt: new Date().toISOString(),
    profiles,
    listAlternative: profiles.map((p) => ({
      assetId: p.assetId,
      label: p.label,
      band: p.reliabilityBand,
      currentAvailability: p.currentAvailability,
      fallback: p.fallback,
      limitations: p.limitations,
    })),
    productionClaim: "none",
  };
}

export function getReliabilityProfile(
  assetId: string,
): AccessReliabilityProfile | undefined {
  return getHarbourReliabilityProfiles().find((p) => p.assetId === assetId);
}

/**
 * Overlay reliability onto a journey segment label/asset.
 * Never upgrades unknown operational state to available.
 */
export function resolveSegmentReliability(
  assetId: string | null | undefined,
): {
  band: AccessReliabilityBand;
  summary: string;
  fallback: string | null;
  fallbackVerified: boolean;
  cannotForecast: boolean;
} {
  if (!assetId) {
    return {
      band: "insufficient_evidence",
      summary: "No reliability asset bound",
      fallback: null,
      fallbackVerified: false,
      cannotForecast: true,
    };
  }
  const profile = getReliabilityProfile(assetId);
  if (!profile) {
    return {
      band: "cannot_forecast",
      summary: "No reliability profile for asset",
      fallback: null,
      fallbackVerified: false,
      cannotForecast: true,
    };
  }
  return {
    band: profile.reliabilityBand,
    summary: `${profile.label}: ${profile.reliabilityBand}`,
    fallback: profile.fallback,
    fallbackVerified: profile.fallbackVerified,
    cannotForecast: true,
  };
}

export function compareReliabilityBands(
  a: AccessReliabilityBand,
  b: AccessReliabilityBand,
): number {
  return BAND_ORDER.indexOf(a) - BAND_ORDER.indexOf(b);
}
