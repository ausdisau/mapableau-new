import type { AccessExplorationDto } from "@/lib/access/experience/access-exploration-dto";
import { EMPTY_CAPABILITY_FACTS } from "@/lib/access/experience/access-exploration-dto";
import type { DemoAccessPlace } from "@/lib/demo/accessibility-places";
import type { GaisEvidenceState } from "@/lib/gais/contracts/evidence";

/**
 * @deprecated Temporary bridge for tests/demos only.
 * Production V2 exploration must use AccessPlace → AccessExplorationDto projection.
 * Do not expand DemoAccessPlace as a permanent architecture.
 */
export function demoAccessPlaceToExplorationDto(
  place: DemoAccessPlace,
): AccessExplorationDto {
  const hasCoordinates =
    typeof place.latitude === "number" &&
    Number.isFinite(place.latitude) &&
    typeof place.longitude === "number" &&
    Number.isFinite(place.longitude);

  const dominantState: GaisEvidenceState =
    place.confidence === "high"
      ? "VERIFIED"
      : place.confidence === "medium"
        ? "PROVIDER_OR_VENUE_DECLARED"
        : place.confidence === "low"
          ? "COMMUNITY_REPORTED"
          : "UNKNOWN";

  const profile = place.profile;

  return {
    accessPlaceId: place.id,
    name: place.name,
    category: place.category,
    suburb: place.suburb,
    stateOrRegion: place.state,
    addressText: `${place.suburb}, ${place.state}`,
    hasCoordinates,
    latitude: hasCoordinates ? (place.latitude as number) : null,
    longitude: hasCoordinates ? (place.longitude as number) : null,
    reviewCount: 0,
    placeProfile: {
      ...profile,
      pathWidthMm: profile.pathWidthMm ?? null,
      maxGradientPercent: profile.maxGradientPercent ?? null,
      kerbRampPresent: profile.kerbRampPresent ?? null,
      liftPresent: profile.liftPresent ?? null,
      changingPlacesPresent: profile.changingPlacesPresent ?? null,
      captioningAvailable: profile.captioningAvailable ?? null,
      highContrastSignage: profile.highContrastSignage ?? null,
      tactileCues: profile.tactileCues ?? null,
      quietArea: profile.quietArea ?? profile.lowSensoryOption,
      lowStimulusEnvironment:
        profile.lowStimulusEnvironment ?? profile.lowSensoryOption,
      textAacCommunication: profile.textAacCommunication ?? null,
      surfaceFirmness: profile.surfaceFirmness ?? null,
    },
    capabilityFacts: {
      ...EMPTY_CAPABILITY_FACTS,
      doorWidthMm: profile.doorWidthMm,
      pathWidthMm: profile.pathWidthMm ?? null,
      maxGradientPercent: profile.maxGradientPercent ?? null,
      kerbRampPresent: profile.kerbRampPresent ?? null,
      liftPresent: profile.liftPresent ?? null,
      changingPlacesPresent: profile.changingPlacesPresent ?? null,
      quietArea: profile.quietArea ?? profile.lowSensoryOption,
      lowStimulusEnvironment:
        profile.lowStimulusEnvironment ?? profile.lowSensoryOption,
    },
    evidence: {
      dominantState,
      freshnessLabel: place.lastChecked
        ? `Last checked ${place.lastChecked}`
        : "Freshness unknown",
      lastObservedAt: place.lastChecked || null,
      confidenceLabel: place.confidence,
      disputed: false,
      refs: [
        {
          sourceType: dominantState,
          sourceLabel: `Demo source: ${place.source}`,
          observedAt: place.lastChecked || undefined,
        },
      ],
    },
    accreditation:
      place.tier && place.tier !== "Unverified"
        ? {
            tier: place.tier,
            disclaimer:
              "Demo accreditation only — not a live MapAble assessment claim.",
          }
        : null,
  };
}
