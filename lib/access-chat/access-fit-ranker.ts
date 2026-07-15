import type { AccessPlaceFeatureType } from "@prisma/client";

import { REQUIRED_FEATURE_TO_TYPES } from "@/lib/access-chat/feature-map";
import { stripReviewPii } from "@/lib/ai/privacy";
import { distanceKm } from "@/lib/geo";
import type {
  AccessSearchIntent,
  AccessSearchResult,
} from "@/types/access-chat";

export type RankablePlace = {
  id: string;
  name: string;
  category: string;
  addressText: string | null;
  suburb: string | null;
  stateOrRegion: string | null;
  confidence: string;
  updatedAt: Date;
  location: { latitude: number; longitude: number } | null;
  features: { type: AccessPlaceFeatureType; notes: string | null }[];
  ratingSummaries: {
    category: string;
    avgScore: number | null;
    sampleCount: number;
  }[];
  reviews: {
    reviewBody: string;
    visitDate: Date | null;
    createdAt: Date;
    photos: { id: string }[];
  }[];
  accreditationAssessments: {
    tier: string | null;
    publishedAt: Date | null;
  }[];
  alerts: { severity: string; title: string; body: string }[];
  _count: { reviews: number };
};

function avgForCategories(
  place: RankablePlace,
  cats: string[],
): number | undefined {
  const rows = place.ratingSummaries.filter((r) => cats.includes(r.category));
  const scores = rows
    .map((r) => r.avgScore)
    .filter((s): s is number => s != null);
  if (!scores.length) return undefined;
  return scores.reduce((a, b) => a + b, 0) / scores.length;
}

function daysSince(date: Date | undefined | null): number | null {
  if (!date) return null;
  return (Date.now() - date.getTime()) / (1000 * 60 * 60 * 24);
}

function lastVerifiedAt(place: RankablePlace): Date | undefined {
  const reviewDates = place.reviews.map((r) => r.visitDate ?? r.createdAt);
  const accredDates = place.accreditationAssessments
    .map((a) => a.publishedAt)
    .filter((d): d is Date => d != null);
  const all = [...reviewDates, ...accredDates];
  if (!all.length) return undefined;
  return new Date(Math.max(...all.map((d) => d.getTime())));
}

function hasFeature(
  place: RankablePlace,
  types: AccessPlaceFeatureType[],
): boolean {
  const set = new Set(place.features.map((f) => f.type));
  return types.some((t) => set.has(t));
}

/**
 * Compare user access needs to place evidence and produce fit labels.
 * Prefer not_enough_information over unsuitability when evidence is thin.
 */
export function rankPlacesByAccessFit(
  places: RankablePlace[],
  intent: AccessSearchIntent,
  options?: { limit?: number },
): AccessSearchResult[] {
  const limit = options?.limit ?? 5;
  const required = intent.requiredFeatures ?? {};
  const requiredKeys = Object.entries(required)
    .filter(([, v]) => v)
    .map(([k]) => k as keyof typeof required);

  const ranked = places
    .map((place) => scorePlace(place, intent, requiredKeys))
    .sort((a, b) => {
      if (b.fit.score !== a.fit.score) return b.fit.score - a.fit.score;
      return b.fit.confidence - a.fit.confidence;
    })
    .slice(0, Math.min(Math.max(limit, 3), 5));

  return ranked;
}

function scorePlace(
  place: RankablePlace,
  intent: AccessSearchIntent,
  requiredKeys: (keyof AccessSearchIntent["requiredFeatures"])[],
): AccessSearchResult {
  const reasons: string[] = [];
  const cautions: string[] = [];
  let score = 40;
  let evidencePoints = 0;
  let missingRequired = 0;
  let matchedRequired = 0;

  const featureSet = new Set(place.features.map((f) => f.type));

  for (const key of requiredKeys) {
    const types = REQUIRED_FEATURE_TO_TYPES[key];
    if (!types?.length) continue;
    if (types.some((t) => featureSet.has(t))) {
      matchedRequired += 1;
      score += 12;
      evidencePoints += 1;
      reasons.push(featureReason(key));
    } else {
      missingRequired += 1;
      score -= 8;
      cautions.push(
        `${featureLabel(key)} has not been confirmed for this place.`,
      );
    }
  }

  const mobilityScore = avgForCategories(place, [
    "path_to_entrance",
    "main_entrance",
    "doorway",
    "internal_movement",
    "ramps_lifts",
    "accessible_parking",
  ]);
  const toiletScore = avgForCategories(place, [
    "accessible_toilet",
    "ambulant_toilet",
  ]);
  const sensoryScore = avgForCategories(place, ["lighting_acoustics"]);
  const communicationScore = avgForCategories(place, [
    "hearing_access",
    "signage",
    "online_information",
  ]);
  const staffServiceScore = avgForCategories(place, [
    "staff_training",
    "service_access",
    "service_counter",
  ]);

  const categoryScores = [
    mobilityScore,
    toiletScore,
    sensoryScore,
    communicationScore,
    staffServiceScore,
  ].filter((s): s is number => s != null);
  const overallScore =
    categoryScores.length > 0
      ? categoryScores.reduce((a, b) => a + b, 0) / categoryScores.length
      : place.ratingSummaries.length
        ? place.ratingSummaries
            .map((r) => r.avgScore ?? 0)
            .reduce((a, b) => a + b, 0) / place.ratingSummaries.length
        : 0;

  if (overallScore > 0) {
    score += overallScore * 4;
    evidencePoints += 1;
    reasons.push(
      `Community access ratings average ${overallScore.toFixed(1)} out of 5.`,
    );
  }

  if (place._count.reviews > 0) {
    score += Math.min(place._count.reviews * 2, 16);
    evidencePoints += 1;
    reasons.push(
      `${place._count.reviews} community review${place._count.reviews === 1 ? "" : "s"}.`,
    );
  } else {
    cautions.push("No published community reviews yet.");
  }

  const verified = lastVerifiedAt(place);
  const verifiedDays = daysSince(verified);
  if (verifiedDays != null) {
    if (verifiedDays <= 31) {
      score += 10;
      reasons.push(
        `Access details were last confirmed about ${Math.max(1, Math.round(verifiedDays))} day(s) ago.`,
      );
    } else if (verifiedDays > 180) {
      score -= 5;
      cautions.push("Last confirmation is older than six months.");
    }
  }

  if (place.confidence === "mapable_accredited") {
    score += 12;
    reasons.push("MapAble Accreditation is published for this venue.");
    evidencePoints += 1;
  } else if (place.confidence === "mapable_verified") {
    score += 8;
    reasons.push("MapAble-verified access information is available.");
    evidencePoints += 1;
  } else if (place.confidence === "unknown") {
    cautions.push("Access confidence is still marked as unknown.");
  }

  const activeAlerts = place.alerts.map(
    (a) => `${a.severity}: ${a.title}${a.body ? ` — ${a.body}` : ""}`,
  );
  for (const alert of place.alerts) {
    if (alert.severity === "disruption") {
      score -= 20;
      cautions.push(`Active disruption: ${alert.title}`);
    } else if (alert.severity === "caution") {
      score -= 10;
      cautions.push(`Caution: ${alert.title}`);
    } else {
      cautions.push(alert.title);
    }
  }

  if (intent.userContext?.avoidCrowds && !hasFeature(place, ["quiet_space", "low_sensory_environment"])) {
    cautions.push(
      "Quiet or low-sensory space has not been confirmed if you are avoiding crowds.",
    );
    score -= 4;
  }

  if (
    intent.userContext?.mobilityAid === "powerchair" ||
    intent.userContext?.mobilityAid === "manual_wheelchair" ||
    intent.userContext?.mobilityAid === "scooter"
  ) {
    if (!hasFeature(place, ["step_free_entry", "ramp_access", "lift_access"])) {
      cautions.push(
        "Step-free entry has not been confirmed for wheeled mobility.",
      );
      missingRequired += 1;
    } else {
      reasons.push("Step-free or ramp/lift access features are listed.");
      matchedRequired += 1;
    }
  }

  let distanceMeters: number | undefined;
  if (
    intent.location?.lat != null &&
    intent.location?.lng != null &&
    place.location
  ) {
    distanceMeters =
      distanceKm(
        intent.location.lat,
        intent.location.lng,
        place.location.latitude,
        place.location.longitude,
      ) * 1000;
    const maxM =
      intent.userContext?.maxDistanceMeters ??
      intent.location.radiusMeters ??
      5000;
    if (distanceMeters > maxM) {
      score -= 15;
      cautions.push("Further than your preferred travel distance.");
    } else {
      score += Math.max(0, 10 - distanceMeters / 500);
    }
  }

  const thinEvidence = evidencePoints < 2 && place._count.reviews === 0;
  let label: AccessSearchResult["fit"]["label"] = "not_enough_information";
  let confidence = Math.min(0.95, 0.25 + evidencePoints * 0.12 + matchedRequired * 0.08);

  if (thinEvidence) {
    label = "not_enough_information";
    confidence = Math.min(confidence, 0.45);
  } else if (missingRequired >= 2 || score < 25) {
    label = "likely_unsuitable";
    confidence = Math.min(confidence, 0.7);
  } else if (missingRequired >= 1 || activeAlerts.length > 0 || score < 55) {
    label = "suitable_with_caution";
  } else {
    label = "likely_suitable";
  }

  const latest = place.reviews[0];
  const address = [place.addressText, place.suburb, place.stateOrRegion]
    .filter(Boolean)
    .join(", ");

  return {
    placeId: place.id,
    name: place.name,
    category: place.category,
    address: address || place.suburb || "Address not listed",
    distanceMeters: distanceMeters != null ? Math.round(distanceMeters) : undefined,
    latitude: place.location?.latitude,
    longitude: place.location?.longitude,
    fit: {
      label,
      score: Math.round(score * 10) / 10,
      confidence: Math.round(confidence * 100) / 100,
      reasons: reasons.slice(0, 6),
      cautions: cautions.slice(0, 6),
    },
    accessSummary: {
      overallScore: Math.round(overallScore * 10) / 10,
      mobilityScore,
      toiletScore,
      sensoryScore,
      communicationScore,
      staffServiceScore,
      lastVerifiedAt: verified?.toISOString(),
    },
    evidence: {
      latestComment: latest
        ? stripReviewPii(latest.reviewBody).slice(0, 280)
        : undefined,
      activeAlerts: activeAlerts.length ? activeAlerts : undefined,
      verifiedByCommunityCount: place._count.reviews,
      photosAvailable: place.reviews.some((r) => r.photos.length > 0),
    },
    actions: {
      openMarkerUrl: `/access?placeId=${place.id}`,
      planTransportUrl: `/api/transport/accessible-trip-from-search?placeId=${place.id}`,
      addReportUrl: `/access/review/${place.id}`,
    },
  };
}

function featureReason(key: string): string {
  switch (key) {
    case "stepFreeAccess":
      return "Step-free entry or ramp/lift access is listed.";
    case "accessibleToilet":
      return "An accessible toilet (or Changing Places) is listed.";
    case "accessibleParking":
      return "Accessible parking is listed.";
    case "quietSpace":
      return "A quiet space is listed.";
    case "hearingLoop":
      return "A hearing loop is listed.";
    case "serviceAnimalFriendly":
      return "Assistance animals are listed as welcome.";
    case "lowSensory":
      return "A low-sensory environment is listed.";
    case "accessibleDropoff":
      return "An accessible drop-off point is listed.";
    default:
      return "Requested access feature is listed.";
  }
}

function featureLabel(key: string): string {
  switch (key) {
    case "stepFreeAccess":
      return "Step-free access";
    case "accessibleToilet":
      return "Accessible toilet";
    case "accessibleParking":
      return "Accessible parking";
    case "quietSpace":
      return "Quiet space";
    case "hearingLoop":
      return "Hearing loop";
    case "serviceAnimalFriendly":
      return "Assistance animal welcome";
    case "lowSensory":
      return "Low sensory environment";
    case "accessibleDropoff":
      return "Accessible drop-off";
    default:
      return "Access feature";
  }
}
