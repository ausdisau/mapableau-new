/**
 * Map live GAIS place summaries onto Access Experience exploration types.
 *
 * Prefer measured / attributed GAIS facts when present. Never invent values —
 * missing attributes stay null / UNKNOWN.
 */

import type {
  AccessExplorationCapability,
  GaisPlaceSummaryLike,
} from "@/lib/access/experience/access-exploration-dto";
import type { PlaceAccessProfile } from "@/lib/access/fit/types";
import type { GaisEvidenceState } from "@/lib/gais/contracts/evidence";
import type { GaisFeature, GaisPlaceSummary } from "@/lib/gais/contracts/feature";
import { humanizeGaisFeatureType } from "@/lib/gais/service/feature-mapper";

const FEATURE_TAG_LABELS: Record<string, string> = {
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

function mapSurface(
  surface: string | undefined,
): PlaceAccessProfile["surfaceQuality"] | undefined {
  if (!surface) return undefined;
  const normalised = surface.toLowerCase();
  if (normalised.includes("smooth")) return "smooth";
  if (normalised.includes("firm")) return "firm";
  if (normalised.includes("uneven") || normalised.includes("rough")) {
    return "uneven";
  }
  // Unrecognised surface strings stay UNKNOWN — do not invent.
  return undefined;
}

function featureCapability(feature: GaisFeature): AccessExplorationCapability | null {
  if (feature.type === "PLACE") return null;

  const tag = feature.properties.accessFeatureTag;
  const label = tag
    ? (FEATURE_TAG_LABELS[tag] ?? tag.replace(/_/g, " "))
    : humanizeGaisFeatureType(feature.type);

  let value: boolean | number | string | null = true;
  let unit: string | undefined;
  if (typeof feature.properties.widthMm === "number") {
    value = feature.properties.widthMm;
    unit = "mm";
  } else if (typeof feature.properties.gradientPercent === "number") {
    value = feature.properties.gradientPercent;
    unit = "%";
  } else if (typeof feature.properties.stepFree === "boolean") {
    value = feature.properties.stepFree;
  } else if (typeof feature.properties.liftAvailable === "boolean") {
    value = feature.properties.liftAvailable;
  } else if (feature.properties.surface) {
    value = feature.properties.surface;
  }

  return {
    key: feature.id,
    label,
    value,
    unit,
    evidenceRefs: feature.evidence.map((evidence) => ({
      sourceType: evidence.sourceType,
      sourceLabel: evidence.sourceLabel,
      observedAt: evidence.observedAt,
      verifiedAt: evidence.verifiedAt,
      confidence: evidence.confidence,
    })),
  };
}

/**
 * Project a live GAIS place summary into the client-safe exploration overlay.
 */
export function toGaisPlaceSummaryLike(
  summary: GaisPlaceSummary | null | undefined,
): GaisPlaceSummaryLike | undefined {
  if (!summary) return undefined;

  const evidenceStates = Array.from(
    new Set(
      summary.features.flatMap((feature) =>
        feature.evidence.map((evidence) => evidence.sourceType),
      ),
    ),
  ) as GaisEvidenceState[];

  const observedAts = summary.features
    .map((feature) => feature.observedAt)
    .filter((value): value is string => Boolean(value))
    .sort();

  const capabilities = summary.features
    .map(featureCapability)
    .filter((capability): capability is AccessExplorationCapability => Boolean(capability));

  const disputed = summary.features.some((feature) =>
    feature.evidence.some((evidence) =>
      (evidence.sourceLabel ?? "").toLowerCase().includes("disput"),
    ),
  );

  return {
    evidenceStates,
    disputed,
    provenanceLabel: `GAIS evidence scope: ${summary.evidenceScope.replace(/_/g, " ")}`,
    freshnessLabel: observedAts.length
      ? `Latest evidence observed ${observedAts[observedAts.length - 1]}`
      : undefined,
    capabilities,
  };
}

/**
 * Overlay GAIS measurements / attributed facts onto an AccessPlace-derived profile.
 * Only fills fields that are still unknown (null). Does not invent false values.
 */
export function overlayGaisOnPlaceAccessProfile(
  base: PlaceAccessProfile,
  summary: GaisPlaceSummary | null | undefined,
): PlaceAccessProfile {
  if (!summary) return base;

  const next: PlaceAccessProfile = { ...base };

  for (const feature of summary.features) {
    const properties = feature.properties;
    const tag = properties.accessFeatureTag;

    if (typeof properties.stepFree === "boolean" && next.stepFreeEntry == null) {
      next.stepFreeEntry = properties.stepFree;
    }
    if (typeof properties.liftAvailable === "boolean") {
      if (next.lift == null) next.lift = properties.liftAvailable;
      if (next.internalStepFree == null) {
        next.internalStepFree = properties.liftAvailable;
      }
    }
    if (typeof properties.widthMm === "number") {
      if (feature.type === "DOOR" || tag === "wide_doorways") {
        if (next.doorWidthMm == null) next.doorWidthMm = properties.widthMm;
      } else if (next.pathWidthMm == null) {
        next.pathWidthMm = properties.widthMm;
      }
    }
    if (
      typeof properties.gradientPercent === "number" &&
      next.maxGradientPercent == null
    ) {
      next.maxGradientPercent = properties.gradientPercent;
    }

    const surface = mapSurface(properties.surface);
    if (surface != null && next.surfaceQuality == null) {
      next.surfaceQuality = surface;
    }

    // Affirmative tags only fill UNKNOWN slots — never invent false.
    if (
      (tag === "step_free_entry" || tag === "ramp_access") &&
      next.stepFreeEntry == null
    ) {
      next.stepFreeEntry = true;
    }
    if ((tag === "lift_access" || feature.type === "LIFT") && next.lift == null) {
      next.lift = true;
      if (next.internalStepFree == null) next.internalStepFree = true;
    }
    if (tag === "accessible_toilet" && next.accessibleToilet == null) {
      next.accessibleToilet = true;
    }
    if (tag === "changing_places") {
      if (next.changingPlaces == null) next.changingPlaces = true;
      if (next.accessibleToilet == null) next.accessibleToilet = true;
    }
    if (tag === "hearing_loop" && next.hearingLoop == null) {
      next.hearingLoop = true;
    }
    if (
      (tag === "quiet_space" || tag === "low_sensory_environment") &&
      next.lowSensoryOption == null
    ) {
      next.lowSensoryOption = true;
    }
    if (tag === "braille_tactile_signage" && next.tactileCues == null) {
      next.tactileCues = true;
    }
    if (tag === "ramp_access" && next.kerbRamp == null) {
      next.kerbRamp = true;
    }
    if (tag === "accessible_parking" && next.accessibleParking == null) {
      next.accessibleParking = true;
    }
    if (tag === "accessible_dropoff" && next.dropOffPoint == null) {
      next.dropOffPoint = true;
    }
    if (
      tag === "assistance_animals_welcome" &&
      next.assistanceAnimalWelcome == null
    ) {
      next.assistanceAnimalWelcome = true;
    }
    if (
      tag === "public_transport_nearby" &&
      next.publicTransportNearby == null
    ) {
      next.publicTransportNearby = true;
    }
  }

  return next;
}
