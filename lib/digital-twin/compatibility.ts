import { confidenceLevelFromScore } from "@/lib/digital-twin/scoring";
import type {
  AccessNeedProfile,
  ManualAccessNeeds,
  TwinCompatibilityResult,
  TwinConfidenceLevel,
  TwinFeature,
  TwinPathSegment,
  TwinPlace,
} from "@/lib/digital-twin/types";

function profileToManualNeeds(profile: AccessNeedProfile): ManualAccessNeeds {
  const mobility = profile.mobilityAids.map((m) => m.toLowerCase());
  const comm = profile.communicationPreferences.map((c) => c.toLowerCase());
  const sensory = profile.sensoryPreferences.map((s) => s.toLowerCase());
  const transport = profile.transportNeeds.map((t) => t.toLowerCase());
  const support = profile.supportPreferences.map((s) => s.toLowerCase());

  return {
    wheelchairOrMobilityAid:
      mobility.some((m) => m.includes("wheelchair") || m.includes("scooter") || m === "walker"),
    needsStepFreeEntrance:
      mobility.some((m) => m.includes("wheelchair") || m.includes("scooter")) ||
      transport.includes("step_free_paths"),
    needsAccessibleToilet:
      mobility.some((m) => m.includes("wheelchair") || m.includes("scooter")),
    needsQuietSpace: sensory.some((s) => s.includes("quiet") || s.includes("low_sensory")),
    needsHearingSupport: sensory.some((s) => s.includes("hearing") || s.includes("loop")),
    needsPlainLanguageInfo:
      comm.includes("plain_language") || comm.includes("written_only"),
    needsAssistanceAnimalReadiness: mobility.includes("assistance_animal"),
    needsRampVehicleDropoff:
      transport.includes("ramp_vehicle") || transport.includes("dropoff"),
    needsFatigueBuffer: support.some((s) => s.includes("fatigue")),
  };
}

function findFeature(
  features: TwinFeature[],
  type: TwinFeature["featureType"]
): TwinFeature | undefined {
  return features.find((f) => f.featureType === type);
}

function featureMeetsNeed(
  feature: TwinFeature | undefined,
  minLevel: TwinFeature["accessibilityLevel"] = "bronze"
): "met" | "barrier" | "unknown" {
  if (!feature) return "unknown";
  if (feature.availability === "unknown" || feature.accessibilityLevel === "unknown") {
    return "unknown";
  }
  if (feature.availability === "unavailable" || feature.accessibilityLevel === "fail") {
    return "barrier";
  }
  if (feature.availability === "partial") return "unknown";
  const levels: TwinFeature["accessibilityLevel"][] = ["fail", "bronze", "silver", "gold"];
  const featureIdx = levels.indexOf(feature.accessibilityLevel);
  const minIdx = levels.indexOf(minLevel);
  return featureIdx >= minIdx ? "met" : "barrier";
}

export function matchMobilityNeeds(
  features: TwinFeature[],
  paths: TwinPathSegment[],
  needs: ManualAccessNeeds
): { matched: string[]; barriers: string[]; unknowns: string[] } {
  const matched: string[] = [];
  const barriers: string[] = [];
  const unknowns: string[] = [];

  if (!needs.wheelchairOrMobilityAid && !needs.needsStepFreeEntrance) {
    return { matched, barriers, unknowns };
  }

  const entrance = findFeature(features, "entrance");
  const entranceResult = featureMeetsNeed(entrance);
  if (entranceResult === "met") matched.push("Step-free entrance");
  else if (entranceResult === "barrier") barriers.push("Step-free entrance not confirmed");
  else unknowns.push("Entrance access needs confirmation");

  const doorway = findFeature(features, "doorway") ?? entrance;
  const width =
    doorway?.measurements?.doorwayWidthMm ?? doorway?.measurements?.widthMm;
  if (needs.wheelchairOrMobilityAid) {
    if (typeof width === "number" && width >= 850) {
      matched.push(`Adequate doorway width (${width}mm)`);
    } else if (typeof width === "number" && width < 850) {
      barriers.push(`Doorway may be too narrow (${width}mm)`);
    } else {
      unknowns.push("Doorway width needs confirmation");
    }
  }

  const stepFreePath = paths.every((p) => !p.hasSteps);
  if (paths.length > 0) {
    if (stepFreePath) matched.push("Step-free path segments");
    else barriers.push("Route includes steps");
  }

  const corridor = findFeature(features, "corridor");
  if (corridor && needs.wheelchairOrMobilityAid) {
    const cw = corridor.measurements?.widthMm;
    if (typeof cw === "number" && cw < 1200) {
      barriers.push("Internal corridor may be too narrow for turning");
    } else if (typeof cw === "number") {
      matched.push("Adequate corridor width");
    }
  }

  if (needs.needsAccessibleToilet) {
    const toilet = findFeature(features, "toilet");
    const toiletResult = featureMeetsNeed(toilet);
    if (toiletResult === "met") matched.push("Accessible toilet");
    else if (toiletResult === "barrier") barriers.push("Accessible toilet not available");
    else unknowns.push("Accessible toilet needs confirmation");
  }

  if (needs.needsFatigueBuffer) {
    const seating = findFeature(features, "seating");
    if (featureMeetsNeed(seating) === "met") matched.push("Rest/seating available");
    else unknowns.push("Seating or rest area needs confirmation");
  }

  return { matched, barriers, unknowns };
}

export function matchCommunicationNeeds(
  features: TwinFeature[],
  needs: ManualAccessNeeds
): { matched: string[]; barriers: string[]; unknowns: string[] } {
  const matched: string[] = [];
  const barriers: string[] = [];
  const unknowns: string[] = [];

  if (!needs.needsPlainLanguageInfo && !needs.needsHearingSupport) {
    return { matched, barriers, unknowns };
  }

  const staff = findFeature(features, "staff_training");
  if (needs.needsPlainLanguageInfo) {
    const staffResult = featureMeetsNeed(staff);
    if (staffResult === "met") matched.push("Staff support for written/plain communication");
    else if (staffResult === "barrier") barriers.push("Plain-language staff support not confirmed");
    else unknowns.push("Staff communication support needs confirmation");
  }

  const online = findFeature(features, "online_info");
  if (needs.needsPlainLanguageInfo) {
    const onlineResult = featureMeetsNeed(online, "bronze");
    if (onlineResult === "met") matched.push("Plain-language online information");
    else unknowns.push("Online information clarity needs confirmation");
  }

  const hearing = findFeature(features, "hearing");
  if (needs.needsHearingSupport) {
    const hearingResult = featureMeetsNeed(hearing);
    if (hearingResult === "met") matched.push("Hearing support (e.g. loop)");
    else if (hearingResult === "barrier") barriers.push("Hearing support not available");
    else unknowns.push("Hearing support needs confirmation");
  }

  return { matched, barriers, unknowns };
}

export function matchSensoryNeeds(
  features: TwinFeature[],
  needs: ManualAccessNeeds
): { matched: string[]; barriers: string[]; unknowns: string[] } {
  const matched: string[] = [];
  const barriers: string[] = [];
  const unknowns: string[] = [];

  if (!needs.needsQuietSpace) return { matched, barriers, unknowns };

  const acoustics = findFeature(features, "acoustics");
  const result = featureMeetsNeed(acoustics);
  if (result === "met") matched.push("Quiet or low-sensory space");
  else if (result === "barrier") barriers.push("Quiet space not available");
  else unknowns.push("Quiet space availability needs confirmation");

  return { matched, barriers, unknowns };
}

export function matchTransportNeeds(
  features: TwinFeature[],
  needs: ManualAccessNeeds
): { matched: string[]; barriers: string[]; unknowns: string[] } {
  const matched: string[] = [];
  const barriers: string[] = [];
  const unknowns: string[] = [];

  if (needs.needsRampVehicleDropoff) {
    const dropoff = findFeature(features, "dropoff");
    const result = featureMeetsNeed(dropoff);
    if (result === "met") matched.push("Ramp vehicle drop-off");
    else if (result === "barrier") barriers.push("Ramp vehicle drop-off not available");
    else unknowns.push("Drop-off access needs confirmation");
  }

  const connection = findFeature(features, "transport_connection");
  if (connection) {
    const result = featureMeetsNeed(connection, "bronze");
    if (result === "met") matched.push("Transport connection");
    else unknowns.push("Transport connection details need confirmation");
  }

  const lift = findFeature(features, "lift");
  if (lift) {
    if (lift.availability === "unavailable" || lift.availability === "temporary_unavailable") {
      barriers.push("Lift currently unavailable");
    } else if (lift.availability === "partial") {
      unknowns.push("Lift status may change — confirm before travelling");
    } else if (lift.availability === "available") {
      matched.push("Lift available");
    }
  }

  return { matched, barriers, unknowns };
}

export function generateRecommendedActions(result: {
  barriers: string[];
  unknowns: string[];
}): string[] {
  const actions: string[] = [];
  for (const b of result.barriers) {
    if (b.includes("toilet")) actions.push("Contact venue about nearest accessible toilet");
    if (b.includes("entrance") || b.includes("Lift")) actions.push("Confirm access route before travelling");
    if (b.includes("narrow")) actions.push("Allow extra time and ask about alternate routes");
  }
  for (const u of result.unknowns) {
    actions.push(`Confirm: ${u.replace(" needs confirmation", "")}`);
  }
  if (actions.length === 0) {
    actions.push("Review place details and confirm any critical needs before visiting");
  }
  return [...new Set(actions)].slice(0, 5);
}

export function evaluatePlaceCompatibility(
  place: TwinPlace,
  features: TwinFeature[],
  paths: TwinPathSegment[],
  profile: AccessNeedProfile | ManualAccessNeeds,
  profileId = "manual"
): TwinCompatibilityResult {
  const needs =
    "mobilityAids" in profile ? profileToManualNeeds(profile) : profile;
  const resolvedProfileId =
    "id" in profile ? profile.id : profileId;

  const placeFeatures = features.filter((f) => f.placeId === place.id);
  const placePaths = paths.filter((p) => p.placeId === place.id);

  const mobility = matchMobilityNeeds(placeFeatures, placePaths, needs);
  const communication = matchCommunicationNeeds(placeFeatures, needs);
  const sensory = matchSensoryNeeds(placeFeatures, needs);
  const transport = matchTransportNeeds(placeFeatures, needs);

  const matchedNeeds = [
    ...mobility.matched,
    ...communication.matched,
    ...sensory.matched,
    ...transport.matched,
  ];
  const barriers = [
    ...mobility.barriers,
    ...communication.barriers,
    ...sensory.barriers,
    ...transport.barriers,
  ];
  const unknowns = [
    ...mobility.unknowns,
    ...communication.unknowns,
    ...sensory.unknowns,
    ...transport.unknowns,
  ];

  const activeNeedCount = Object.values(needs).filter(Boolean).length || 1;
  const metRatio = matchedNeeds.length / activeNeedCount;
  const barrierPenalty = barriers.length * 10;
  const unknownPenalty = unknowns.length * 5;
  let compatibilityScore = Math.round(metRatio * 100 - barrierPenalty - unknownPenalty);
  compatibilityScore = Math.max(0, Math.min(100, compatibilityScore));

  const confidenceScore = 100 - unknowns.length * 15 - barriers.length * 10;
  const confidence: TwinConfidenceLevel = confidenceLevelFromScore(
    Math.max(0, confidenceScore)
  );

  const recommendedActions = generateRecommendedActions({ barriers, unknowns });

  let explanationPlainLanguage: string;
  if (compatibilityScore >= 80) {
    explanationPlainLanguage = `Strong match for your selected access needs at ${place.name}.`;
  } else if (compatibilityScore >= 50) {
    explanationPlainLanguage = `Partial match at ${place.name}. Some needs are met but others need confirmation or may be difficult.`;
  } else {
    explanationPlainLanguage = `Limited match at ${place.name}. Several barriers may affect your visit — confirm before travelling.`;
  }
  if (unknowns.length > 0) {
    explanationPlainLanguage += ` ${unknowns.length} item(s) need confirmation.`;
  }

  return {
    placeId: place.id,
    profileId: resolvedProfileId,
    compatibilityScore,
    matchedNeeds,
    barriers,
    unknowns,
    recommendedActions,
    confidence,
    explanationPlainLanguage,
  };
}

/**
 * Privacy: this function is pure and does not persist profile data.
 * Callers must not log or store profile contents without consent.
 */
export function evaluatePlaceCompatibilitySafe(
  place: TwinPlace,
  features: TwinFeature[],
  paths: TwinPathSegment[],
  profile: AccessNeedProfile | ManualAccessNeeds,
  profileId?: string
): TwinCompatibilityResult {
  return evaluatePlaceCompatibility(place, features, paths, profile, profileId);
}
