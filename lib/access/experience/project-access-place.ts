import type {
  AccessExplorationCapabilityFacts,
  AccessExplorationDto,
} from "@/lib/access/experience/access-exploration-dto";
import { EMPTY_CAPABILITY_FACTS } from "@/lib/access/experience/access-exploration-dto";
import type { PlaceAccessProfile } from "@/lib/access/fit/types";
import type { GaisEvidenceRef, GaisEvidenceState } from "@/lib/gais/contracts/evidence";
import type { GaisFeature } from "@/lib/gais/contracts/feature";

export type AccessPlaceProjectionInput = {
  id: string;
  name: string;
  category: string;
  suburb?: string | null;
  stateOrRegion?: string | null;
  addressText?: string | null;
  confidence?: string | null;
  location?: { latitude: number; longitude: number } | null;
  features?: Array<{ type: string }>;
  _count?: { reviews?: number };
  reviewCount?: number;
  accreditationTier?: string | null;
};

function featureSet(features: Array<{ type: string }> | undefined): Set<string> {
  return new Set((features ?? []).map((f) => f.type));
}

/** Returns true if any tag present; null when the place has no feature tags at all. */
function has(features: Set<string>, ...keys: string[]): boolean | null {
  if (features.size === 0) return null;
  return keys.some((key) => features.has(key)) ? true : null;
}

function mapConfidence(
  confidence: string | null | undefined,
): PlaceAccessProfile["confidence"] {
  switch (confidence) {
    case "mapable_verified":
    case "mapable_accredited":
    case "high":
      return "high";
    case "multiple_user_reports":
    case "venue_claimed":
    case "medium":
      return "medium";
    case "user_reported":
    case "low":
      return "low";
    default:
      return "unknown";
  }
}

function confidenceToGaisState(
  confidence: PlaceAccessProfile["confidence"],
): GaisEvidenceState {
  switch (confidence) {
    case "high":
      return "VERIFIED";
    case "medium":
      return "PROVIDER_OR_VENUE_DECLARED";
    case "low":
      return "COMMUNITY_REPORTED";
    default:
      return "UNKNOWN";
  }
}

function freshnessLabel(lastVerified: string | null): string {
  if (!lastVerified) return "Freshness unknown";
  const then = Date.parse(lastVerified);
  if (Number.isNaN(then)) return "Freshness unknown";
  const days = Math.floor((Date.now() - then) / (1000 * 60 * 60 * 24));
  if (days <= 30) return "Observed within 30 days";
  if (days <= 180) return "Observed within 6 months";
  return "May be stale — confirm on arrival";
}

/**
 * Maps AccessPlace feature tags → capability facts.
 * Missing tags stay null (UNKNOWN) — never invent measurements.
 */
export function capabilityFactsFromFeatureTags(
  featureTypes: string[],
): AccessExplorationCapabilityFacts {
  const features = new Set(featureTypes);
  return {
    ...EMPTY_CAPABILITY_FACTS,
    kerbRampPresent: has(features, "ramp_access"),
    liftPresent: has(features, "lift_access"),
    changingPlacesPresent: has(features, "changing_places"),
    highContrastSignage: has(features, "braille_tactile_signage"),
    tactileCues: has(features, "braille_tactile_signage"),
    quietArea: has(features, "quiet_space", "low_sensory_environment"),
    lowStimulusEnvironment: has(features, "low_sensory_environment"),
  };
}

export function placeAccessProfileFromFeatures(
  input: AccessPlaceProjectionInput,
  facts: AccessExplorationCapabilityFacts,
): PlaceAccessProfile {
  const features = featureSet(input.features);
  return {
    stepFreeEntry: has(features, "step_free_entry", "ramp_access"),
    doorWidthMm: facts.doorWidthMm,
    internalStepFree: has(features, "lift_access", "step_free_entry"),
    accessibleToilet: has(features, "accessible_toilet", "changing_places"),
    accessibleParking: has(features, "accessible_parking"),
    dropOffPoint: has(features, "accessible_dropoff"),
    lowSensoryOption: has(features, "quiet_space", "low_sensory_environment"),
    hearingLoop: has(features, "hearing_loop"),
    staffTraining: null,
    assistanceAnimalWelcome: has(features, "assistance_animals_welcome"),
    publicTransportNearby: has(features, "public_transport_nearby"),
    transportBookable: null,
    lastVerified: null,
    confidence: mapConfidence(input.confidence),
    pathWidthMm: facts.pathWidthMm,
    maxGradientPercent: facts.maxGradientPercent,
    kerbRampPresent: facts.kerbRampPresent,
    liftPresent: facts.liftPresent,
    changingPlacesPresent: facts.changingPlacesPresent,
    captioningAvailable: facts.captioningAvailable,
    highContrastSignage: facts.highContrastSignage,
    tactileCues: facts.tactileCues,
    quietArea: facts.quietArea,
    lowStimulusEnvironment: facts.lowStimulusEnvironment,
    textAacCommunication: facts.textAacCommunication,
    surfaceFirmness: facts.surfaceFirmness,
  };
}

function mergeGaisEvidence(
  confidence: PlaceAccessProfile["confidence"],
  gaisFeatures: GaisFeature[] | undefined,
): {
  dominantState: GaisEvidenceState;
  refs: GaisEvidenceRef[];
  disputed: boolean;
  lastObservedAt: string | null;
} {
  const refs: GaisEvidenceRef[] = [];
  const disputed = false;
  let lastObservedAt: string | null = null;

  for (const feature of gaisFeatures ?? []) {
    for (const ref of feature.evidence ?? []) {
      refs.push(ref);
      if (ref.observedAt && (!lastObservedAt || ref.observedAt > lastObservedAt)) {
        lastObservedAt = ref.observedAt;
      }
    }
    if (feature.observedAt && (!lastObservedAt || feature.observedAt > lastObservedAt)) {
      lastObservedAt = feature.observedAt;
    }
  }

  if (refs.length === 0) {
    return {
      dominantState: confidenceToGaisState(confidence),
      refs: [
        {
          sourceType: confidenceToGaisState(confidence),
          sourceLabel: "AccessPlace published features",
        },
      ],
      disputed: false,
      lastObservedAt: null,
    };
  }

  const counts = new Map<GaisEvidenceState, number>();
  for (const ref of refs) {
    counts.set(ref.sourceType, (counts.get(ref.sourceType) ?? 0) + 1);
  }
  let dominantState: GaisEvidenceState = "UNKNOWN";
  let best = -1;
  for (const [state, count] of counts) {
    if (count > best) {
      best = count;
      dominantState = state;
    }
  }

  return { dominantState, refs: refs.slice(0, 12), disputed, lastObservedAt };
}

/**
 * Project a published AccessPlace (+ optional GAIS features) into a client-safe DTO.
 */
export function projectAccessPlaceToExplorationDto(
  place: AccessPlaceProjectionInput,
  gaisFeatures?: GaisFeature[],
): AccessExplorationDto {
  const facts = capabilityFactsFromFeatureTags(
    (place.features ?? []).map((f) => f.type),
  );
  const placeProfile = placeAccessProfileFromFeatures(place, facts);
  const lat = place.location?.latitude ?? null;
  const lng = place.location?.longitude ?? null;
  const hasCoordinates =
    typeof lat === "number" &&
    Number.isFinite(lat) &&
    typeof lng === "number" &&
    Number.isFinite(lng);

  const evidenceMerge = mergeGaisEvidence(placeProfile.confidence, gaisFeatures);

  return {
    accessPlaceId: place.id,
    name: place.name,
    category: place.category,
    suburb: place.suburb ?? null,
    stateOrRegion: place.stateOrRegion ?? null,
    addressText: place.addressText ?? null,
    hasCoordinates,
    latitude: hasCoordinates ? lat : null,
    longitude: hasCoordinates ? lng : null,
    reviewCount: place.reviewCount ?? place._count?.reviews ?? 0,
    placeProfile,
    capabilityFacts: facts,
    evidence: {
      dominantState: evidenceMerge.dominantState,
      freshnessLabel: freshnessLabel(
        evidenceMerge.lastObservedAt ?? placeProfile.lastVerified,
      ),
      lastObservedAt: evidenceMerge.lastObservedAt,
      confidenceLabel: placeProfile.confidence,
      disputed: evidenceMerge.disputed,
      refs: evidenceMerge.refs,
    },
    accreditation: place.accreditationTier
      ? {
          tier: place.accreditationTier,
          disclaimer:
            "Accreditation reflects a point-in-time assessment. Conditions can change — confirm details that matter to you.",
        }
      : null,
  };
}
