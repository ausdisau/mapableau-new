import type { DemoAccessPlace } from "@/lib/demo/accessibility-places";
import {
  ACCESS_PREFLIGHT_CHECKS,
  ACCESS_PREFLIGHT_LABELS,
  DOOR_CLEAR_WIDTH_THRESHOLD_MM,
  type AccessEvidenceRecord,
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

function isCurrent(evidence: AccessEvidenceRecord, now = Date.now()): boolean {
  if (evidence.disputeState === "disputed" || evidence.disputeState === "superseded") {
    return false;
  }
  if (evidence.disputeState === "expired") return false;
  if (evidence.expiresAt && new Date(evidence.expiresAt).getTime() <= now) {
    return false;
  }
  return true;
}

/**
 * Resolve a fact from typed evidence only.
 * Never promote floor plans, staff training, scores or narrative notes to confirmed.
 */
export function resolveFactFromEvidence(
  id: AccessPreflightCheckId,
  evidence: AccessEvidenceRecord[],
): AccessPreflightFact {
  const label = ACCESS_PREFLIGHT_LABELS[id];
  const matches = evidence.filter((row) => row.factType === id && isCurrent(row));

  if (matches.length === 0) {
    return {
      id,
      label,
      state: "unknown",
      critical: CRITICAL_CHECKS.has(id),
      confidence: "unknown",
      explanation:
        "No current verified evidence. Unknown is not the same as accessible.",
    };
  }

  const unavailable = matches.find((row) => row.state === "unavailable");
  if (unavailable) {
    return {
      id,
      label,
      state: "unavailable",
      critical: CRITICAL_CHECKS.has(id),
      source: unavailable.source,
      verificationStatus: unavailable.verificationMethod,
      lastCheckedAt: unavailable.verifiedAt,
      notes: unavailable.notes,
      confidence: unavailable.confidence,
      value: unavailable.value,
      unit: unavailable.unit,
      explanation:
        unavailable.notes ??
        "Verified evidence reports this feature as unavailable.",
    };
  }

  const confirmed = matches.find((row) => row.state === "confirmed");
  if (confirmed) {
    return {
      id,
      label,
      state: "confirmed",
      critical: CRITICAL_CHECKS.has(id),
      source: confirmed.source,
      verificationStatus: confirmed.verificationMethod,
      lastCheckedAt: confirmed.verifiedAt,
      notes: confirmed.notes,
      confidence: confirmed.confidence,
      value: confirmed.value,
      unit: confirmed.unit,
      explanation: [
        "Confirmed from typed evidence",
        confirmed.source ? `source: ${confirmed.source}` : null,
        confirmed.verifiedAt ? `verified: ${confirmed.verifiedAt}` : null,
        confirmed.value != null && confirmed.unit
          ? `value: ${confirmed.value} ${confirmed.unit}`
          : null,
      ]
        .filter(Boolean)
        .join("; "),
    };
  }

  const na = matches.find((row) => row.state === "not_applicable");
  if (na) {
    return {
      id,
      label,
      state: "not_applicable",
      critical: CRITICAL_CHECKS.has(id),
      source: na.source,
      lastCheckedAt: na.verifiedAt,
      confidence: na.confidence,
      explanation: na.notes ?? "Marked not applicable for this place.",
    };
  }

  return {
    id,
    label,
    state: "unknown",
    critical: CRITICAL_CHECKS.has(id),
    confidence: "unknown",
    explanation:
      "Evidence exists but is not a current confirmation. Treated as unknown.",
  };
}

/**
 * Parse a clear door width in millimetres from structured text.
 * Returns null when the value cannot be parsed safely.
 */
export function parseDoorWidthMm(raw: string): number | null {
  const match = raw.match(/(\d{2,4})\s*(mm|millimetres?|millimeters?)?\b/i);
  if (!match) return null;
  const value = Number(match[1]);
  if (!Number.isFinite(value) || value < 400 || value > 3000) return null;
  return value;
}

/**
 * Demo adapter — maps only explicit PlaceAccessProfile booleans / numeric door width.
 * All narrative measurements, sensory notes, domains, floor plans and scores → Unknown.
 */
export function evidenceFromDemoPlace(place: DemoAccessPlace): AccessEvidenceRecord[] {
  const profile = place.profile;
  const base = {
    source: place.source,
    sourceRecordId: place.id,
    verificationMethod: "demo_profile_field",
    verifiedAt: place.lastChecked || profile.lastVerified || undefined,
    expiresAt: null,
    confidence:
      place.confidence === "high" ||
      place.confidence === "medium" ||
      place.confidence === "low"
        ? place.confidence
        : ("unknown" as const),
    disputeState: "none" as const,
  };

  const out: AccessEvidenceRecord[] = [];

  function pushBool(
    factType: AccessPreflightCheckId,
    value: boolean | null | undefined,
  ) {
    if (value === true) {
      out.push({ ...base, factType, state: "confirmed" });
    } else if (value === false) {
      out.push({ ...base, factType, state: "unavailable" });
    }
    // null/undefined → omit → remains unknown
  }

  pushBool("step_free_entrance", profile.stepFreeEntry);
  pushBool("lift_availability", profile.internalStepFree);
  pushBool("accessible_toilet", profile.accessibleToilet);
  pushBool("quiet_low_sensory", profile.lowSensoryOption);
  pushBool("assistance_animal", profile.assistanceAnimalWelcome);

  if (profile.accessibleParking != null || profile.dropOffPoint != null) {
    const ok = Boolean(profile.accessibleParking || profile.dropOffPoint);
    out.push({
      ...base,
      factType: "accessible_parking_dropoff",
      state: ok ? "confirmed" : "unavailable",
    });
  }

  if (profile.hearingLoop != null || profile.staffTraining != null) {
    // Only hearingLoop confirms communication access; staff training alone does not.
    if (profile.hearingLoop === true) {
      out.push({
        ...base,
        factType: "accessible_communication",
        state: "confirmed",
        notes: "Hearing loop reported on place profile.",
      });
    } else if (profile.hearingLoop === false) {
      out.push({
        ...base,
        factType: "accessible_communication",
        state: "unavailable",
      });
    }
  }

  if (typeof profile.doorWidthMm === "number") {
    const mm = profile.doorWidthMm;
    out.push({
      ...base,
      factType: "door_width",
      state: mm >= DOOR_CLEAR_WIDTH_THRESHOLD_MM ? "confirmed" : "unavailable",
      value: mm,
      unit: "mm",
      notes: `Clear width ${mm} mm. Threshold for this check: ${DOOR_CLEAR_WIDTH_THRESHOLD_MM} mm (guidance, not a universal guarantee).`,
    });
  }

  // Intentionally ignored for confirmation: measurements[], sensoryNotes[],
  // domains[], topAccessFacts, hasFloorPlan, accessScore, staffTraining alone,
  // keyBarrier narrative. They must not upgrade Unknown → Confirmed.

  return out;
}

export function buildAccessPreflightFromEvidence(params: {
  placeName: string;
  placeId?: string;
  evidence: AccessEvidenceRecord[];
}): AccessPreflightResult {
  const facts = ACCESS_PREFLIGHT_CHECKS.map((id) =>
    resolveFactFromEvidence(id, params.evidence),
  );
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
    placeName: params.placeName,
    placeId: params.placeId,
    facts,
    unresolvedCritical,
    nextActions,
  };
}

export function buildAccessPreflight(place: DemoAccessPlace): AccessPreflightResult {
  return buildAccessPreflightFromEvidence({
    placeName: place.name,
    placeId: place.id,
    evidence: evidenceFromDemoPlace(place),
  });
}

export function hasUnresolvedUnknown(facts: AccessPreflightFact[]): boolean {
  return facts.some((fact) => fact.state === "unknown");
}

export function stateFromBool(value: boolean | null | undefined): AccessFactState {
  if (value === true) return "confirmed";
  if (value === false) return "unavailable";
  return "unknown";
}
