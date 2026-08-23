import type {
  AccessPlace,
  AccessPlaceFeature,
  AccessPlaceLocation,
} from "@prisma/client";

import type { GaisEvidenceRef } from "@/lib/gais/contracts/evidence";
import { GAIS_EVIDENCE_STATE_LABELS } from "@/lib/gais/contracts/evidence";
import type { GaisPoint } from "@/lib/gais/contracts/geometry";
import { placeConfidenceToGaisEvidenceState } from "@/lib/gais/service/evidence-mapper";

import {
  ARRIVAL_FEATURE_TAGS,
  arrivalFeatureLabel,
  arrivalKindFromFeatureTag,
} from "./labels";
import type {
  GaisArrivalFeature,
  GaisDestinationResolution,
} from "./types";

type PlaceForDestination = AccessPlace & {
  location: AccessPlaceLocation | null;
  features: AccessPlaceFeature[];
};

function placeEvidence(place: AccessPlace): GaisEvidenceRef {
  const sourceType = placeConfidenceToGaisEvidenceState(
    place.confidence,
    place.sourceType,
  );
  return {
    id: `place-${place.id}`,
    sourceType,
    sourceLabel:
      sourceType === "UNKNOWN"
        ? "Unknown"
        : GAIS_EVIDENCE_STATE_LABELS[sourceType],
    observedAt: place.updatedAt.toISOString(),
  };
}

function centrePointFromLocation(
  location: AccessPlaceLocation | null,
): GaisPoint | null {
  if (!location) return null;
  return {
    type: "Point",
    coordinates: [location.longitude, location.latitude],
  };
}

/**
 * Build an arrival feature from a place feature tag.
 * Geometry is always null today — AccessPlaceFeature has no coordinates.
 * Do not copy place centre onto entrances (that would invent entrance location).
 */
export function mapPlaceFeatureToArrivalFeature(
  place: AccessPlace,
  feature: AccessPlaceFeature,
): GaisArrivalFeature | null {
  const kind = arrivalKindFromFeatureTag(feature.type);
  if (!kind) return null;

  const evidence = [placeEvidence(place)];
  const unknowns: string[] = ["geometry"];

  // Tag presence is not verified physical measurement.
  if (kind === "ENTRANCE" || kind === "DROP_OFF") {
    unknowns.push("accessibilityMeasurements");
  }

  const description = feature.notes?.trim() || undefined;

  return {
    id: `gais-arrival-${place.id}-${feature.type}`,
    kind,
    label: arrivalFeatureLabel(kind, feature.type),
    geometry: null,
    description,
    accessFeatureTag: feature.type,
    evidence,
    unknowns,
  };
}

function mainEntrancePlaceholder(place: AccessPlace): GaisArrivalFeature {
  return {
    id: `gais-arrival-${place.id}-main-entrance`,
    kind: "MAIN_ENTRANCE",
    label: arrivalFeatureLabel("MAIN_ENTRANCE"),
    geometry: null,
    evidence: [placeEvidence(place)],
    unknowns: ["geometry", "accessibilityEvidence"],
  };
}

/**
 * Pure destination resolution from an AccessPlace record.
 * Never invents entrance/drop-off coordinates or door widths.
 */
export function resolveDestinationFromPlace(
  place: PlaceForDestination,
): GaisDestinationResolution {
  const evidence = [placeEvidence(place)];
  const centrePoint = centrePointFromLocation(place.location);

  const arrivalFeatures = place.features
    .filter((f) => ARRIVAL_FEATURE_TAGS.includes(f.type))
    .map((f) => mapPlaceFeatureToArrivalFeature(place, f))
    .filter((f): f is GaisArrivalFeature => f != null);

  const knownEntrances = [
    mainEntrancePlaceholder(place),
    ...arrivalFeatures.filter((f) => f.kind === "ENTRANCE"),
  ];
  const knownDropOffPoints = arrivalFeatures.filter((f) => f.kind === "DROP_OFF");
  const otherArrivalFeatures = arrivalFeatures.filter(
    (f) => f.kind !== "ENTRANCE" && f.kind !== "DROP_OFF",
  );

  const unknowns: string[] = [];
  if (!centrePoint) unknowns.push("centrePoint");

  const entrancesWithoutGeometry = knownEntrances.filter((e) => e.geometry == null);
  if (entrancesWithoutGeometry.length) {
    unknowns.push("entranceCoordinates");
  }
  if (!knownDropOffPoints.length) {
    unknowns.push("dropOffPoints");
  } else if (knownDropOffPoints.every((d) => d.geometry == null)) {
    unknowns.push("dropOffCoordinates");
  }

  const hasStepFreeTag = place.features.some((f) => f.type === "step_free_entry");
  if (hasStepFreeTag) {
    unknowns.push("verifiedStepFreeMeasurements");
  }

  unknowns.push("indoorPaths");

  return {
    place: {
      placeId: place.id,
      name: place.name,
      category: place.category,
      addressText: place.addressText,
      suburb: place.suburb,
      stateOrRegion: place.stateOrRegion,
      confidence: place.confidence,
      sourceType: place.sourceType,
    },
    centrePoint,
    knownEntrances,
    knownDropOffPoints,
    otherArrivalFeatures,
    evidence,
    unknowns,
    meta: {
      claimState: "in_development",
      indoorNavigation: false,
      fabricatedCoordinates: false,
      note: "Access Destination Resolution returns recorded place facts and arrival feature tags only. Entrance and drop-off coordinates are UNKNOWN unless stored with provenance. Not indoor navigation.",
    },
  };
}
