/**
 * AccessPlace feature tags → PlaceAccessProfile for AccessFit V2.
 * Tag present → true. Tag absent → null (UNKNOWN). Never invent false.
 */

import type { AccessPlaceLike } from "@/lib/access/experience/access-exploration-dto";
import type { PlaceAccessProfile } from "@/lib/access/fit/types";

function hasFeature(
  features: { type: string }[] | undefined,
  type: string,
): boolean {
  return Boolean(features?.some((f) => f.type === type));
}

function mapConfidence(
  raw: string | null | undefined,
): PlaceAccessProfile["confidence"] {
  switch (raw) {
    case "mapable_accredited":
    case "mapable_verified":
      return "high";
    case "venue_claimed":
    case "multiple_user_reports":
      return "medium";
    case "user_reported":
      return "low";
    default:
      return "unknown";
  }
}

function lastVerifiedIso(place: AccessPlaceLike): string | null {
  const confidence = mapConfidence(place.confidence);
  if (confidence === "high" || confidence === "medium") {
    if (place.updatedAt instanceof Date) return place.updatedAt.toISOString();
    if (typeof place.updatedAt === "string") return place.updatedAt;
  }
  return null;
}

/**
 * Map AccessPlace feature tags into PlaceAccessProfile.
 * Affirmative tags only — missing tags stay null (UNKNOWN for AccessFit).
 */
export function accessPlaceToPlaceAccessProfile(
  place: AccessPlaceLike,
): PlaceAccessProfile {
  const features = place.features;
  const stepFree =
    hasFeature(features, "step_free_entry") || hasFeature(features, "ramp_access")
      ? true
      : null;
  const lift = hasFeature(features, "lift_access") ? true : null;

  return {
    stepFreeEntry: stepFree,
    doorWidthMm: null,
    internalStepFree: lift,
    accessibleToilet:
      hasFeature(features, "accessible_toilet") ||
      hasFeature(features, "changing_places")
        ? true
        : null,
    accessibleParking: hasFeature(features, "accessible_parking") ? true : null,
    dropOffPoint: hasFeature(features, "accessible_dropoff") ? true : null,
    lowSensoryOption:
      hasFeature(features, "quiet_space") ||
      hasFeature(features, "low_sensory_environment")
        ? true
        : null,
    hearingLoop: hasFeature(features, "hearing_loop") ? true : null,
    staffTraining: null,
    assistanceAnimalWelcome: hasFeature(features, "assistance_animals_welcome")
      ? true
      : null,
    publicTransportNearby: hasFeature(features, "public_transport_nearby")
      ? true
      : null,
    transportBookable: null,
    lastVerified: lastVerifiedIso(place),
    confidence: mapConfidence(place.confidence),
    // Affirmative tags never invent millimetre values — leave numeric evidence UNKNOWN.
    pathWidthMm: null,
    maxGradientPercent: null,
    kerbRamp: hasFeature(features, "ramp_access") ? true : null,
    lift,
    changingPlaces: hasFeature(features, "changing_places") ? true : null,
    captioning: null,
    highContrastSignage: null,
    tactileCues: hasFeature(features, "braille_tactile_signage") ? true : null,
    surfaceQuality: null,
  };
}
