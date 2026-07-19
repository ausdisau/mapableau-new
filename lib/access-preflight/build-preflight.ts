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

function domainState(
  place: DemoAccessPlace,
  names: string[],
): AccessFactState | null {
  const matches = place.domains.filter((domain) =>
    names.some((name) => domain.name.toLowerCase().includes(name.toLowerCase())),
  );
  if (matches.length === 0) return null;
  if (matches.some((domain) => domain.status === "barrier")) return "unavailable";
  if (matches.every((domain) => domain.status === "unknown")) return "unknown";
  if (matches.some((domain) => domain.status === "known")) return "confirmed";
  return "unknown";
}

function domainNotes(place: DemoAccessPlace, names: string[]): string | undefined {
  const matches = place.domains.filter((domain) =>
    names.some((name) => domain.name.toLowerCase().includes(name.toLowerCase())),
  );
  if (matches.length === 0) return undefined;
  return matches.map((domain) => `${domain.name}: ${domain.summary}`).join(" ");
}

function measurementNotes(place: DemoAccessPlace, labels: string[]): string | undefined {
  const matches = place.measurements.filter((item) =>
    labels.some((label) => item.label.toLowerCase().includes(label.toLowerCase())),
  );
  if (matches.length === 0) return undefined;
  return matches
    .map((item) =>
      item.note ? `${item.label}: ${item.value} (${item.note})` : `${item.label}: ${item.value}`,
    )
    .join("; ");
}

function sensoryHint(
  place: DemoAccessPlace,
  keywords: string[],
): AccessFactState | null {
  const haystack = place.sensoryNotes.join(" ").toLowerCase();
  if (!haystack) return null;
  const positive = keywords.some((word) => haystack.includes(word));
  if (positive) return "confirmed";
  return null;
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

function enrichFromPlaceEvidence(
  place: DemoAccessPlace,
  id: AccessPreflightCheckId,
  baseState: AccessFactState,
): { state: AccessFactState; notes?: string } {
  // Never upgrade unknown to confirmed from a soft score alone.
  switch (id) {
    case "door_width": {
      const notes = measurementNotes(place, ["door", "width", "clear width"]);
      if (baseState !== "unknown") return { state: baseState, notes };
      return { state: notes ? "confirmed" : "unknown", notes };
    }
    case "surface_gradient_kerb": {
      const notes =
        measurementNotes(place, ["gradient", "path", "kerb", "ramp"]) ??
        domainNotes(place, ["External path", "path of travel"]);
      const domain = domainState(place, ["External path", "path of travel"]);
      if (baseState !== "unknown") return { state: baseState, notes };
      return { state: domain ?? (notes ? "confirmed" : "unknown"), notes };
    }
    case "quiet_low_sensory": {
      const notes = place.sensoryNotes.length
        ? place.sensoryNotes.join(" ")
        : domainNotes(place, ["sensory", "Information"]);
      const sensory = sensoryHint(place, ["quiet", "low sensory", "quieter"]);
      if (baseState !== "unknown") return { state: baseState, notes };
      return { state: sensory ?? "unknown", notes };
    }
    case "lighting_noise": {
      const notes = place.sensoryNotes.length
        ? place.sensoryNotes.join(" ")
        : undefined;
      if (baseState !== "unknown") return { state: baseState, notes };
      if (!notes) return { state: "unknown" };
      if (/(noisy|loud|busy|bright|flash)/i.test(notes)) {
        return { state: "unavailable", notes };
      }
      return { state: "confirmed", notes };
    }
    case "changing_places": {
      const haystack = [
        ...place.topAccessFacts,
        ...place.domains.map((d) => `${d.name} ${d.summary}`),
      ]
        .join(" ")
        .toLowerCase();
      if (haystack.includes("changing places")) {
        return {
          state: "confirmed",
          notes: "Mentioned in place access facts or domains.",
        };
      }
      return { state: "unknown" };
    }
    case "lift_availability": {
      const notes = domainNotes(place, ["Internal movement", "lift"]);
      if (baseState !== "unknown") return { state: baseState, notes };
      const domain = domainState(place, ["Internal movement"]);
      return { state: domain ?? "unknown", notes };
    }
    case "alternative_route": {
      if (place.hasFloorPlan) {
        return {
          state: "confirmed",
          notes: "A published floor plan is available to plan an alternative route.",
        };
      }
      const barrier = place.keyBarrier;
      if (barrier) {
        return {
          state: "unknown",
          notes: `Known barrier to plan around: ${barrier}. Alternative route not confirmed.`,
        };
      }
      return { state: "unknown" };
    }
    case "emergency_evacuation": {
      const haystack = place.domains
        .map((d) => `${d.name} ${d.summary}`)
        .join(" ")
        .toLowerCase();
      if (haystack.includes("evacuat") || haystack.includes("emergency")) {
        const domain = domainState(place, ["Staff", "Entry", "Internal"]);
        return {
          state: domain ?? "unknown",
          notes: domainNotes(place, ["Staff", "Entry", "Internal"]),
        };
      }
      return { state: "unknown" };
    }
    case "support_person": {
      const haystack = place.domains
        .map((d) => `${d.name} ${d.summary}`)
        .join(" ")
        .toLowerCase();
      if (haystack.includes("support person") || haystack.includes("carer")) {
        return { state: "confirmed", notes: domainNotes(place, ["Staff"]) };
      }
      if (place.profile.staffTraining === true) {
        return {
          state: "confirmed",
          notes: "Staff assistance is reported; confirm support-person access on the day.",
        };
      }
      return { state: "unknown" };
    }
    case "equipment_charging": {
      const haystack = [
        ...place.topAccessFacts,
        ...place.measurements.map((m) => m.label),
      ]
        .join(" ")
        .toLowerCase();
      if (haystack.includes("charg")) {
        return { state: "confirmed", notes: "Charging mentioned in place facts." };
      }
      return { state: "unknown" };
    }
    default:
      return { state: baseState };
  }
}

function mapCheck(place: DemoAccessPlace, id: AccessPreflightCheckId): AccessPreflightFact {
  const baseState = boolState(profileValue(place.profile, id));
  const enriched = enrichFromPlaceEvidence(place, id, baseState);
  const state = enriched.state;

  let notes = enriched.notes;
  if (state === "unknown" && !notes) {
    notes =
      "No confirmed information yet. Unknown is not the same as accessible.";
  } else if (state === "unavailable" && !notes) {
    notes = "Reported as not available for this place.";
  }

  if (place.keyBarrier && CRITICAL_CHECKS.has(id) && state !== "confirmed") {
    notes = [notes, `Key barrier noted: ${place.keyBarrier}`]
      .filter(Boolean)
      .join(" ");
  }

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
    notes,
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
