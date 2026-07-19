import type { PlaceAccessProfile } from "@/lib/access-fit/types";
import type { DemoAccessPlace } from "@/lib/demo/accessibility-places";
import {
  ACCESS_PREFLIGHT_CHECKS,
  ACCESS_PREFLIGHT_LABELS,
  type AccessFactState,
  type AccessPreflightCheckId,
  type AccessPreflightFact,
  type AccessPreflightResult,
} from "@/types/access-preflight";

const CRITICAL_CHECKS = new Set<AccessPreflightCheckId>([
  "step_free_entrance",
  "accessible_toilet",
  "accessible_parking_dropoff",
  "emergency_evacuation",
]);

function boolState(value: boolean | null | undefined): AccessFactState {
  if (value === true) return "confirmed";
  if (value === false) return "unavailable";
  return "unknown";
}

function profileValue(
  profile: PlaceAccessProfile,
  id: AccessPreflightCheckId,
): boolean | null | undefined {
  switch (id) {
    case "step_free_entrance":
      return profile.stepFreeEntry;
    case "door_width":
      return typeof profile.doorWidthMm === "number"
        ? profile.doorWidthMm >= 850
        : null;
    case "lift_availability":
      return profile.internalStepFree;
    case "accessible_toilet":
      return profile.accessibleToilet;
    case "accessible_parking_dropoff":
      if (profile.accessibleParking == null && profile.dropOffPoint == null) {
        return null;
      }
      return Boolean(profile.accessibleParking || profile.dropOffPoint);
    case "quiet_low_sensory":
      return profile.lowSensoryOption;
    case "assistance_animal":
      return profile.assistanceAnimalWelcome;
    case "accessible_communication":
      return profile.hearingLoop ?? profile.staffTraining;
    case "changing_places":
    case "surface_gradient_kerb":
    case "lighting_noise":
    case "equipment_charging":
    case "support_person":
    case "emergency_evacuation":
    case "alternative_route":
      return null;
    default: {
      const _exhaustive: never = id;
      return _exhaustive;
    }
  }
}

function mapCheck(place: DemoAccessPlace, id: AccessPreflightCheckId): AccessPreflightFact {
  const state = boolState(profileValue(place.profile, id));
  return {
    id,
    label: ACCESS_PREFLIGHT_LABELS[id],
    state,
    critical: CRITICAL_CHECKS.has(id),
    source: place.source,
    verificationStatus: place.confidence,
    lastCheckedAt: place.lastChecked,
    confidence:
      state === "unknown"
        ? "unknown"
        : place.confidence === "high"
          ? "high"
          : place.confidence === "medium"
            ? "medium"
            : "low",
    notes:
      state === "unknown"
        ? "No confirmed information yet. Unknown is not the same as accessible."
        : state === "unavailable"
          ? "Reported as not available for this place."
          : undefined,
  };
}

export function buildAccessPreflight(place: DemoAccessPlace): AccessPreflightResult {
  const facts = ACCESS_PREFLIGHT_CHECKS.map((id) => mapCheck(place, id));
  const unresolvedCritical = facts.filter(
    (fact) =>
      fact.critical && (fact.state === "unknown" || fact.state === "unavailable"),
  );

  const nextActions: string[] = [];
  if (unresolvedCritical.length > 0) {
    nextActions.push(
      "Contact the venue or provider to confirm critical access details before travelling.",
    );
    nextActions.push(
      "Choose an alternative place if you cannot get confirmation in time.",
    );
    nextActions.push(
      "Report missing or incorrect information using Report an access barrier.",
    );
  } else {
    nextActions.push(
      "Review the notes for each item and keep a backup plan for travel days.",
    );
  }

  return {
    placeName: place.name,
    placeId: place.id,
    facts,
    unresolvedCritical,
    nextActions,
  };
}

/** Never treat missing facts as accessible. */
export function hasUnresolvedUnknown(facts: AccessPreflightFact[]): boolean {
  return facts.some((fact) => fact.state === "unknown");
}
