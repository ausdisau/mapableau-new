import type { AccessEvidenceClass } from "@/lib/access-intelligence-next";

import type {
  AccessCastCondition,
  AccessCastEvidenceRef,
  AccessCastFallback,
  AccessCastRequirement,
  AccessCastSyntheticScenarioId,
} from "./types";

/** Canonical Harbour Civic synthetic IDs — aligned with Living Access Graph. */
export const HARBOUR_ACCESSCAST_IDS = {
  precinctId: "harbour_civic",
  placeNodeId: "harbour_civic.place",
  placeCanonicalRef: "accessplace:synthetic:harbour_civic",
  entranceWest: "harbour_civic.entrance_west",
  entranceNorth: "harbour_civic.entrance_north",
  liftA: "harbour_civic.lift_a",
  room312: "harbour_civic.room_3_12",
  pathExternal: "harbour_civic.path_external",
  toiletL3: "harbour_civic.toilet_l3",
  snapshotId: "harbour-civic-synthetic-v1",
} as const;

export type HarbourAccessCastFixture = {
  scenarioId: AccessCastSyntheticScenarioId;
  placeRef: string;
  journeyLabel: string;
  intendedJourneyTime: string;
  asOf: string;
  requirementSetRef: string;
  requirements: AccessCastRequirement[];
  evidence: AccessCastEvidenceRef[];
  conditions: AccessCastCondition[];
  hasSinglePointOfFailure: boolean;
  fallback: AccessCastFallback | null;
  hasAdditionalBurden: boolean;
  hasConflicts: boolean;
  hasActiveVerifiedBlocker: boolean;
  criticalEvidenceStale: boolean;
  serviceRequestedButUnconfirmed: boolean;
  overlappingUncertaintyOnHardRequirement: boolean;
  offlineBeyondExpiry: boolean;
  blockingEvidenceClasses: AccessEvidenceClass[];
  reliability: string | null;
  why: string[];
  suggestedChecks: string[];
  limitations: string[];
  segmentSpecs: HarbourSegmentSpec[];
  timelineHints: Array<{ offsetMinutes: number; label: string; kind: string }>;
};

export type HarbourSegmentSpec = {
  id: string;
  kind: string;
  label: string;
  nodeIds: string[];
  evidenceClass: AccessEvidenceClass;
  evidenceSummary: string;
  freshness: "fresh" | "aging" | "stale" | "unknown";
  reliability: string | null;
  hardRequirementEffect: "none" | "supports" | "blocks" | "unresolved";
  responsibleOrganisation: string;
  confirmationLabel: string | null;
  isSpof: boolean;
  returnLeg?: boolean;
};

const BASE_REQUIREMENTS: AccessCastRequirement[] = [
  {
    ontologyConceptId: "physical.step_free",
    kind: "require",
    status: "matched",
    hard: true,
    detail: "Step-free western entrance verified in synthetic fixture",
  },
  {
    ontologyConceptId: "physical.minimum_clear_width_mm",
    kind: "require",
    status: "matched",
    hard: true,
    detail: "Western entrance clear width 910 mm meets ≥ 850 mm requirement",
  },
  {
    ontologyConceptId: "physical.lift_operational",
    kind: "require",
    status: "unresolved",
    hard: true,
    detail: "Lift A operational status unknown in baseline fixture",
  },
  {
    ontologyConceptId: "transport.accessible_vehicle",
    kind: "require",
    status: "unresolved",
    hard: true,
    detail: "Accessible vehicle requested but not confirmed",
  },
];

function evidence(
  id: string,
  cls: AccessEvidenceClass,
  concept: string,
  observedAt: string,
  summary: string,
  freshUntil?: string | null,
): AccessCastEvidenceRef {
  return {
    evidenceId: id,
    class: cls,
    ontologyConceptId: concept,
    source: "harbour_accesscast_synthetic",
    observedAt,
    summary,
    limitations: ["Synthetic fixture — not a production claim"],
    freshUntil: freshUntil ?? null,
  };
}

const BASE_SEGMENTS: HarbourSegmentSpec[] = [
  {
    id: "seg-origin",
    kind: "origin",
    label: "Home origin",
    nodeIds: [],
    evidenceClass: "synthetic_fixture",
    evidenceSummary: "Participant origin (synthetic)",
    freshness: "fresh",
    reliability: null,
    hardRequirementEffect: "none",
    responsibleOrganisation: "Participant",
    confirmationLabel: null,
    isSpof: false,
  },
  {
    id: "seg-transport",
    kind: "accessible_transport",
    label: "Accessible vehicle to Harbour",
    nodeIds: [],
    evidenceClass: "venue_declaration",
    evidenceSummary: "Accessible vehicle requested — acceptance pending",
    freshness: "aging",
    reliability: "insufficient_evidence",
    hardRequirementEffect: "unresolved",
    responsibleOrganisation: "MapAble Transport (synthetic)",
    confirmationLabel: "Confirm the accessible vehicle",
    isSpof: true,
  },
  {
    id: "seg-external",
    kind: "external_path",
    label: "External approach path",
    nodeIds: [HARBOUR_ACCESSCAST_IDS.pathExternal],
    evidenceClass: "independently_verified_claim",
    evidenceSummary: "Step-free sealed path, 1800 mm clear width",
    freshness: "fresh",
    reliability: "insufficient_evidence",
    hardRequirementEffect: "supports",
    responsibleOrganisation: "Harbour Civic Precinct (synthetic)",
    confirmationLabel: null,
    isSpof: false,
  },
  {
    id: "seg-entrance",
    kind: "entrance",
    label: "Western entrance",
    nodeIds: [HARBOUR_ACCESSCAST_IDS.entranceWest],
    evidenceClass: "independently_verified_claim",
    evidenceSummary: "Step-free western entrance verified at 910 mm",
    freshness: "fresh",
    reliability: "insufficient_evidence",
    hardRequirementEffect: "supports",
    responsibleOrganisation: "Harbour Civic Centre (synthetic)",
    confirmationLabel: null,
    isSpof: false,
  },
  {
    id: "seg-lift",
    kind: "internal_route",
    label: "Lift A to level 3",
    nodeIds: [HARBOUR_ACCESSCAST_IDS.liftA],
    evidenceClass: "synthetic_fixture",
    evidenceSummary: "Lift A has no live operational status",
    freshness: "stale",
    reliability: "cannot_forecast",
    hardRequirementEffect: "unresolved",
    responsibleOrganisation: "Harbour Civic Facilities (synthetic)",
    confirmationLabel: "Ask the venue whether Lift A is operating",
    isSpof: true,
  },
  {
    id: "seg-room",
    kind: "destination_room",
    label: "Room 3.12",
    nodeIds: [HARBOUR_ACCESSCAST_IDS.room312],
    evidenceClass: "synthetic_fixture",
    evidenceSummary: "Destination room on level 3",
    freshness: "fresh",
    reliability: null,
    hardRequirementEffect: "none",
    responsibleOrganisation: "Harbour Civic Centre (synthetic)",
    confirmationLabel: null,
    isSpof: false,
  },
  {
    id: "seg-return",
    kind: "return_journey",
    label: "Return accessible transport",
    nodeIds: [],
    evidenceClass: "venue_declaration",
    evidenceSummary: "Return accessible trip requested but not accepted",
    freshness: "aging",
    reliability: "insufficient_evidence",
    hardRequirementEffect: "unresolved",
    responsibleOrganisation: "MapAble Transport (synthetic)",
    confirmationLabel: "Confirm return accessible transport",
    isSpof: true,
    returnLeg: true,
  },
];

/**
 * Synthetic Harbour AccessCast fixtures for deterministic demos and tests.
 * Scenario A (starting_work_tomorrow) is the default place+journey outlook.
 */
export function getHarbourAccessCastFixture(
  scenario: AccessCastSyntheticScenarioId = "harbour_place_baseline",
  intendedJourneyTime?: string,
  asOf?: string,
): HarbourAccessCastFixture {
  const defaultAsOf = asOf ?? "2026-07-16T18:00:00.000+10:00";
  const defaultIntended =
    intendedJourneyTime ?? "2026-07-17T08:30:00.000+10:00";

  const base: HarbourAccessCastFixture = {
    scenarioId: scenario,
    placeRef: HARBOUR_ACCESSCAST_IDS.placeCanonicalRef,
    journeyLabel: "Home to Harbour Civic Centre, Room 3.12",
    intendedJourneyTime: defaultIntended,
    asOf: defaultAsOf,
    requirementSetRef: "fixture:taylor-harbour-accesscast-v1",
    requirements: structuredClone(BASE_REQUIREMENTS),
    evidence: [
      evidence(
        "ev-entrance-west-width",
        "independently_verified_claim",
        "physical.minimum_clear_width_mm",
        "2026-06-01T00:00:00.000Z",
        "Western entrance clear width 910 mm",
      ),
      evidence(
        "ev-entrance-west-stepfree",
        "independently_verified_claim",
        "physical.step_free",
        "2026-06-01T00:00:00.000Z",
        "Western entrance step-free",
      ),
      evidence(
        "ev-lift-stale",
        "synthetic_fixture",
        "physical.lift_operational",
        "2026-06-01T00:00:00.000Z",
        "Lift A status not live; last fixture observation aged",
        "2026-06-02T00:00:00.000Z",
      ),
      evidence(
        "ev-vehicle-requested",
        "venue_declaration",
        "transport.accessible_vehicle",
        defaultAsOf,
        "Accessible vehicle requested — not yet accepted by operator",
      ),
    ],
    conditions: [
      {
        id: "cond-north-construction",
        label: "Northern entrance construction",
        kind: "construction",
        effectiveFrom: "2026-07-17T08:00:00.000+10:00",
        effectiveTo: "2026-07-17T18:00:00.000+10:00",
        affectsNodeIds: [HARBOUR_ACCESSCAST_IDS.entranceNorth],
        hardRequirementImpact: false,
        summary: "Northern entrance construction begins at 8:00 am",
      },
    ],
    hasSinglePointOfFailure: true,
    fallback: {
      id: "fb-none",
      label: "No verified step-free fallback",
      verified: false,
      summary: "No fully verified fallback route is currently known.",
      limitations: ["Staff entrance excluded by participant avoid rule"],
    },
    hasAdditionalBurden: false,
    hasConflicts: false,
    hasActiveVerifiedBlocker: false,
    criticalEvidenceStale: true,
    serviceRequestedButUnconfirmed: true,
    overlappingUncertaintyOnHardRequirement: false,
    offlineBeyondExpiry: false,
    blockingEvidenceClasses: [],
    reliability: "cannot_forecast",
    why: [
      "Step-free western entrance is verified",
      "Accessible vehicle is requested but not confirmed",
      "Destination lift has no live status",
      "Northern entrance construction begins at 8:00 am",
    ],
    suggestedChecks: [
      "Confirm the vehicle",
      "Ask the venue whether the lift is operating",
      "Save the western entrance route in the Visit Pack",
    ],
    limitations: [
      "Synthetic AccessCast — not a safety guarantee",
      "Not a navigation authority or professional access assessment",
      "Lift operational state is unknown — cannot_forecast is not a reliability score",
      "Model predictions are not operational truth",
    ],
    segmentSpecs: structuredClone(BASE_SEGMENTS),
    timelineHints: [
      { offsetMinutes: -60, label: "Accessible vehicle confirmation due", kind: "confirmation_due" },
      { offsetMinutes: -30, label: "Construction scheduled near northern entrance", kind: "scheduled_change" },
      { offsetMinutes: -15, label: "Recommended departure buffer begins", kind: "recovery_buffer" },
      { offsetMinutes: 0, label: "Journey start", kind: "journey_start" },
      { offsetMinutes: 40, label: "Expected arrival", kind: "expected_arrival" },
      { offsetMinutes: 60, label: "Workplace induction", kind: "appointment" },
      { offsetMinutes: 210, label: "Return-transport confirmation due", kind: "return_confirmation" },
    ],
  };

  switch (scenario) {
    case "harbour_place_baseline":
      return {
        ...base,
        journeyLabel: "Harbour Civic Centre place outlook",
        segmentSpecs: BASE_SEGMENTS.filter((s) =>
          ["seg-external", "seg-entrance", "seg-lift", "seg-room"].includes(s.id),
        ),
        serviceRequestedButUnconfirmed: false,
        requirements: BASE_REQUIREMENTS.filter(
          (r) => r.ontologyConceptId !== "transport.accessible_vehicle",
        ),
        why: [
          "Step-free western entrance is verified",
          "Destination lift has no live status",
          "Northern entrance construction is scheduled",
        ],
        suggestedChecks: [
          "Ask the venue whether the lift is operating",
          "Prefer the western entrance",
        ],
      };
    case "starting_work_tomorrow":
      return base;
    case "community_event":
      return {
        ...base,
        scenarioId: "community_event",
        journeyLabel: "Accessible community theatre event",
        intendedJourneyTime: intendedJourneyTime ?? "2026-07-18T18:30:00.000+10:00",
        requirements: [
          {
            ontologyConceptId: "physical.step_free",
            kind: "require",
            status: "matched",
            hard: true,
            detail: "Event access profile — entrance route verified",
          },
          {
            ontologyConceptId: "physical.accessible_toilet",
            kind: "require",
            status: "failed",
            hard: false,
            detail: "Temporary accessible toilet unavailable",
          },
          {
            ontologyConceptId: "cognitive_communication.quiet_space",
            kind: "prefer",
            status: "unresolved",
            hard: false,
            detail: "Quiet-space information is unknown",
          },
          {
            ontologyConceptId: "transport.accessible_vehicle",
            kind: "require",
            status: "unresolved",
            hard: true,
            detail: "Accessible return transport is not confirmed",
          },
        ],
        hasActiveVerifiedBlocker: false,
        criticalEvidenceStale: false,
        hasAdditionalBurden: true,
        hasSinglePointOfFailure: true,
        serviceRequestedButUnconfirmed: true,
        why: [
          "Event access profile exists",
          "Entrance route is verified",
          "Temporary accessible toilet unavailable — additional burden",
          "Accessible return transport is not confirmed",
          "Quiet-space information is unknown",
          "Rain may affect an unsealed approach path (governed advisory only)",
        ],
        suggestedChecks: [
          "Confirm accessible return transport",
          "Ask organiser about quiet space",
          "Check sealed-path alternative if rain is forecast",
        ],
        conditions: [
          {
            id: "cond-rain-unsealed",
            label: "Rain-sensitive unsealed path",
            kind: "environmental",
            effectiveFrom: defaultAsOf,
            effectiveTo: null,
            affectsNodeIds: [HARBOUR_ACCESSCAST_IDS.pathExternal],
            hardRequirementImpact: false,
            summary:
              "Rain forecast + unsealed route segment may mean surface degradation — not route inaccessible",
          },
        ],
      };
    case "lift_outage":
      return {
        ...base,
        scenarioId: "lift_outage",
        requirements: BASE_REQUIREMENTS.map((r) =>
          r.ontologyConceptId === "physical.lift_operational"
            ? {
                ...r,
                status: "failed" as const,
                detail: "Active verified lift outage — no step-free fallback",
              }
            : r,
        ),
        hasActiveVerifiedBlocker: true,
        criticalEvidenceStale: false,
        blockingEvidenceClasses: ["independently_verified_claim"],
        evidence: [
          ...base.evidence.filter((e) => e.ontologyConceptId !== "physical.lift_operational"),
          evidence(
            "ev-lift-outage",
            "independently_verified_claim",
            "physical.lift_operational",
            defaultAsOf,
            "Lift A verified out of service",
          ),
        ],
        why: [
          "Active verified Lift A outage",
          "No verified step-free fallback to level 3",
        ],
        suggestedChecks: [
          "Request human navigator",
          "Ask venue for alternative accessible room on ground level",
        ],
        segmentSpecs: BASE_SEGMENTS.map((s) =>
          s.id === "seg-lift"
            ? {
                ...s,
                hardRequirementEffect: "blocks" as const,
                freshness: "fresh" as const,
                evidenceSummary: "Lift A verified out of service",
                evidenceClass: "independently_verified_claim" as const,
              }
            : s,
        ),
      };
    case "conflicting_venue":
      return {
        ...base,
        scenarioId: "conflicting_venue",
        hasConflicts: true,
        criticalEvidenceStale: false,
        hasActiveVerifiedBlocker: false,
        why: [
          "Venue declares Lift A restored",
          "Recent participant report says Lift A unavailable",
          "Human confirmation is required",
        ],
        suggestedChecks: [
          "Ask the venue to confirm lift status with a timestamped update",
          "Request a human navigator",
        ],
        evidence: [
          evidence(
            "ev-venue-lift-ok",
            "venue_declaration",
            "physical.lift_operational",
            defaultAsOf,
            "Venue says Lift A restored",
          ),
          evidence(
            "ev-participant-lift-down",
            "participant_observation",
            "physical.lift_operational",
            defaultAsOf,
            "Recent participant report: Lift A unavailable",
          ),
        ],
      };
    case "offline_expired":
      return {
        ...base,
        scenarioId: "offline_expired",
        offlineBeyondExpiry: true,
        why: [
          "Saved AccessCast expired while the device was offline",
          "Sources were not refreshed",
          "This offline forecast must not be treated as current",
        ],
        suggestedChecks: [
          "Reconnect and refresh AccessCast",
          "Confirm vehicle and lift status before travel",
        ],
      };
    case "vision_false_positive":
      return {
        ...base,
        scenarioId: "vision_false_positive",
        hasActiveVerifiedBlocker: true,
        blockingEvidenceClasses: ["model_candidate"],
        criticalEvidenceStale: false,
        serviceRequestedButUnconfirmed: false,
        requirements: BASE_REQUIREMENTS.map((r) =>
          r.ontologyConceptId === "physical.lift_operational" ||
          r.ontologyConceptId === "transport.accessible_vehicle"
            ? { ...r, status: "matched" as const }
            : r,
        ),
        hasSinglePointOfFailure: false,
        why: [
          "Possible barrier detected by Vision Access (unverified model candidate)",
          "No participant confirmation — candidate must not mark the route unavailable",
        ],
        suggestedChecks: [
          "Review the Access Lens candidate privately",
          "Capture a confirmed observation if needed",
        ],
        evidence: [
          evidence(
            "ev-vision-candidate",
            "model_candidate",
            "temporary_obstruction",
            defaultAsOf,
            "Possible temporary barrier near western entrance (unverified)",
          ),
        ],
      };
    case "return_journey_fragile":
      return {
        ...base,
        scenarioId: "return_journey_fragile",
        criticalEvidenceStale: false,
        evidence: [
          evidence(
            "ev-entrance-west-width",
            "independently_verified_claim",
            "physical.minimum_clear_width_mm",
            "2026-06-01T00:00:00.000Z",
            "Western entrance clear width 910 mm",
          ),
          evidence(
            "ev-entrance-west-stepfree",
            "independently_verified_claim",
            "physical.step_free",
            "2026-06-01T00:00:00.000Z",
            "Western entrance step-free",
          ),
          evidence(
            "ev-lift-confirmed",
            "operational_sensor",
            "physical.lift_operational",
            defaultAsOf,
            "Lift A confirmed operating for outward trip",
            "2026-07-17T12:00:00.000+10:00",
          ),
          evidence(
            "ev-vehicle-outward-ok",
            "venue_declaration",
            "transport.accessible_vehicle",
            defaultAsOf,
            "Outward accessible vehicle confirmed; return not accepted",
            "2026-07-17T12:00:00.000+10:00",
          ),
        ],
        requirements: BASE_REQUIREMENTS.map((r) => {
          if (r.ontologyConceptId === "physical.lift_operational") {
            return {
              ...r,
              status: "matched" as const,
              detail: "Lift A confirmed operating for outward trip",
            };
          }
          if (r.ontologyConceptId === "transport.accessible_vehicle") {
            return {
              ...r,
              status: "unresolved" as const,
              detail: "Outward vehicle confirmed; return trip requested but not accepted",
            };
          }
          return r;
        }),
        why: [
          "Outward accessible trip is confirmed",
          "Accessible return trip requested but not accepted",
          "Whole journey remains fragile until return is confirmed",
        ],
        suggestedChecks: [
          "Confirm return accessible transport",
          "Save a ContinuityOS fallback plan if available",
        ],
        segmentSpecs: BASE_SEGMENTS.map((s) => {
          if (s.id === "seg-transport") {
            return {
              ...s,
              hardRequirementEffect: "supports" as const,
              evidenceSummary: "Outward accessible vehicle confirmed",
              confirmationLabel: null,
              isSpof: false,
              freshness: "fresh" as const,
            };
          }
          if (s.id === "seg-lift") {
            return {
              ...s,
              hardRequirementEffect: "supports" as const,
              evidenceSummary: "Lift A confirmed operating for outward trip",
              confirmationLabel: null,
              isSpof: false,
              freshness: "fresh" as const,
              evidenceClass: "operational_sensor" as const,
            };
          }
          return s;
        }),
      };
    default: {
      const _exhaustive: never = scenario;
      return _exhaustive;
    }
  }
}
