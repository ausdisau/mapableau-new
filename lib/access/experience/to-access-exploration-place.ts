/**
 * Project AccessPlace (+ optional GAIS summary) → AccessExplorationPlace.
 * Canonical V2 discovery path — not DemoAccessPlace.
 */

import type {
  AccessExplorationCapability,
  AccessExplorationPlace,
  AccessPlaceLike,
  GaisPlaceSummaryLike,
} from "@/lib/access/experience/access-exploration-dto";
import { accessPlaceToPlaceAccessProfile } from "@/lib/access/experience/access-place-profile-adapter";
import {
  overlayGaisOnPlaceAccessProfile,
  toGaisPlaceSummaryLike,
} from "@/lib/access/experience/gais-place-summary-adapter";
import type { PlaceAccessProfile } from "@/lib/access/fit/types";
import type { GaisPlaceSummary } from "@/lib/gais/contracts/feature";

const FEATURE_LABELS: Record<string, string> = {
  step_free_entry: "Step-free entry",
  accessible_parking: "Accessible parking",
  accessible_toilet: "Accessible toilet",
  changing_places: "Changing Places facility",
  lift_access: "Lift access",
  ramp_access: "Ramp access",
  wide_doorways: "Wide doorways",
  wide_paths: "Wide paths",
  hearing_loop: "Hearing loop",
  braille_tactile_signage: "Braille / tactile signage",
  quiet_space: "Quiet space",
  low_sensory_environment: "Low-sensory environment",
  assistance_animals_welcome: "Assistance animals welcome",
  accessible_dropoff: "Accessible drop-off",
  public_transport_nearby: "Public transport nearby",
};

function featureCapabilities(
  features: { type: string }[] | undefined,
  confidence: PlaceAccessProfile["confidence"],
  lastVerified: string | null,
): AccessExplorationCapability[] {
  if (!features?.length) return [];
  const sourceType =
    confidence === "high"
      ? ("VERIFIED" as const)
      : confidence === "medium" || confidence === "low"
        ? ("COMMUNITY_REPORTED" as const)
        : ("UNKNOWN" as const);

  return features.map((f) => ({
    key: f.type,
    label: FEATURE_LABELS[f.type] ?? f.type.replace(/_/g, " "),
    value: true as boolean | null,
    evidenceRefs: [
      {
        sourceType,
        sourceLabel: FEATURE_LABELS[f.type] ?? f.type,
        observedAt: lastVerified ?? undefined,
        verifiedAt: confidence === "high" ? (lastVerified ?? undefined) : undefined,
      },
    ],
  }));
}

function countUnknownCapabilities(profile: PlaceAccessProfile): number {
  const values: Array<boolean | number | string | null | undefined> = [
    profile.stepFreeEntry,
    profile.doorWidthMm,
    profile.internalStepFree,
    profile.accessibleToilet,
    profile.accessibleParking,
    profile.dropOffPoint,
    profile.lowSensoryOption,
    profile.hearingLoop,
    profile.staffTraining,
    profile.assistanceAnimalWelcome,
    profile.publicTransportNearby,
    profile.transportBookable,
    profile.pathWidthMm,
    profile.maxGradientPercent,
    profile.kerbRamp,
    profile.lift,
    profile.changingPlaces,
    profile.captioning,
    profile.highContrastSignage,
    profile.tactileCues,
    profile.surfaceQuality,
  ];
  return values.filter((v) => v == null).length;
}

/**
 * Canonical projector: AccessPlace (+ optional GAIS summary) → exploration DTO.
 */
export function toAccessExplorationPlace(
  place: AccessPlaceLike,
  gaisSummary?: GaisPlaceSummaryLike | null,
  options?: { accessProfile?: PlaceAccessProfile },
): AccessExplorationPlace {
  const lat = place.location?.latitude ?? null;
  const lng = place.location?.longitude ?? null;
  const hasCoordinates =
    typeof lat === "number" &&
    Number.isFinite(lat) &&
    typeof lng === "number" &&
    Number.isFinite(lng);

  const accessProfile =
    options?.accessProfile ?? accessPlaceToPlaceAccessProfile(place);
  const lastVerified = accessProfile.lastVerified;
  const confidence = accessProfile.confidence;

  const baseCapabilities = featureCapabilities(
    place.features,
    confidence,
    lastVerified,
  );
  const gaisCapabilities = gaisSummary?.capabilities ?? [];
  const seen = new Set(baseCapabilities.map((capability) => capability.key));
  const capabilities = [
    ...baseCapabilities,
    ...gaisCapabilities.filter((capability) => {
      if (seen.has(capability.key)) return false;
      seen.add(capability.key);
      return true;
    }),
  ];

  return {
    placeId: place.id,
    name: place.name,
    category: place.category,
    addressText: place.addressText ?? null,
    suburb: place.suburb ?? null,
    stateOrRegion: place.stateOrRegion ?? null,
    latitude: hasCoordinates ? lat : null,
    longitude: hasCoordinates ? lng : null,
    hasCoordinates,
    reviewCount: place._count?.reviews ?? 0,
    confidence,
    lastVerified,
    accessProfile,
    capabilities,
    provenanceSummary:
      gaisSummary?.provenanceLabel ??
      (place.sourceType
        ? `Source: ${place.sourceType.replace(/_/g, " ")}`
        : undefined),
    freshnessLabel: gaisSummary?.freshnessLabel,
    disputed: Boolean(gaisSummary?.disputed),
    unknownCapabilityCount: countUnknownCapabilities(accessProfile),
    accreditationSummary: null,
    sourceType: place.sourceType ?? undefined,
  };
}

/**
 * AccessPlace + live GAIS summary → exploration DTO with UNKNOWN-preserving overlay.
 * Bulk list discovery should keep using AccessPlace-only projection.
 */
export function toAccessExplorationPlaceWithGais(
  place: AccessPlaceLike,
  gais: GaisPlaceSummary | null | undefined,
): AccessExplorationPlace {
  const baseProfile = accessPlaceToPlaceAccessProfile(place);
  const accessProfile = overlayGaisOnPlaceAccessProfile(baseProfile, gais);
  return toAccessExplorationPlace(place, toGaisPlaceSummaryLike(gais), {
    accessProfile,
  });
}

export function toAccessExplorationPlaces(
  places: AccessPlaceLike[],
): AccessExplorationPlace[] {
  return places.map((p) => toAccessExplorationPlace(p));
}
