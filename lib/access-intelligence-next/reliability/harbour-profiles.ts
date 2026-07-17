import type { AccessReliabilityProfile } from "./types";

/**
 * Synthetic Harbour Civic reliability fixtures.
 * Lift A is a hard dependency with cannot_forecast — not "safe".
 */
export const HARBOUR_RELIABILITY_PROFILES: AccessReliabilityProfile[] = [
  {
    assetId: "harbour_civic.lift_a",
    assetKind: "lift",
    label: "Lift A",
    placeRef: "harbour_civic",
    graphNodeId: "harbour_civic.lift_a",
    currentAvailability: "unknown",
    reliabilityBand: "cannot_forecast",
    recurringFailurePattern: null,
    fallback: "No verified step-free alternative to level 3 in fixture",
    fallbackVerified: false,
    lastIncidentSummary: null,
    lastIncidentAt: null,
    observations: [
      {
        id: "obs-lift-fixture-1",
        observedAt: "2026-07-01T00:00:00+10:00",
        state: "unknown",
        evidenceClass: "synthetic_fixture",
        summary: "No live operational sensor bound in synthetic mode",
        sourceRef: "fixture:harbour-reliability-v1",
      },
    ],
    limitations: [
      "Lift status is not live",
      "cannot_forecast is not a reliability score",
      "Absence of incident history does not prove availability",
    ],
    cannotForecastPreciseProbability: true,
    modelVersion: null,
    operatingMode: "synthetic",
  },
  {
    assetId: "harbour_civic.entrance_west",
    assetKind: "automatic_door",
    label: "Western entrance door",
    placeRef: "harbour_civic",
    graphNodeId: "harbour_civic.entrance_west",
    currentAvailability: "current",
    reliabilityBand: "insufficient_evidence",
    recurringFailurePattern: null,
    fallback: "Staff entrance excluded by participant avoid rule",
    fallbackVerified: false,
    lastIncidentSummary: null,
    lastIncidentAt: null,
    observations: [
      {
        id: "obs-door-fixture-1",
        observedAt: "2026-06-15T00:00:00+10:00",
        state: "current",
        evidenceClass: "independently_verified_claim",
        summary: "Clear width verified; operational door reliability not forecast",
        sourceRef: "fixture:harbour-reliability-v1",
      },
    ],
    limitations: [
      "Geometry verification is not operational reliability",
      "No precise failure probability is available",
    ],
    cannotForecastPreciseProbability: true,
    modelVersion: null,
    operatingMode: "synthetic",
  },
  {
    assetId: "harbour_civic.toilet_l3",
    assetKind: "accessible_toilet",
    label: "Level 3 accessible toilet",
    placeRef: "harbour_civic",
    graphNodeId: "harbour_civic.toilet_l3",
    currentAvailability: "current",
    reliabilityBand: "insufficient_evidence",
    recurringFailurePattern: null,
    fallback: null,
    fallbackVerified: false,
    lastIncidentSummary: null,
    lastIncidentAt: null,
    observations: [
      {
        id: "obs-toilet-fixture-1",
        observedAt: "2026-05-01T00:00:00+10:00",
        state: "current",
        evidenceClass: "venue_declaration",
        summary: "Venue-declared accessible toilet near Room 3.12",
        sourceRef: "fixture:harbour-reliability-v1",
      },
    ],
    limitations: [
      "Venue declaration is distinct from independent verification",
      "Current availability not confirmed today",
    ],
    cannotForecastPreciseProbability: true,
    modelVersion: null,
    operatingMode: "synthetic",
  },
  {
    assetId: "harbour_civic.stop_ferry",
    assetKind: "transport_service",
    label: "Harbour ferry accessible berth",
    placeRef: "harbour_civic",
    graphNodeId: "harbour_civic.stop_ferry",
    currentAvailability: "current",
    reliabilityBand: "cannot_forecast",
    recurringFailurePattern: null,
    fallback: null,
    fallbackVerified: false,
    lastIncidentSummary: null,
    lastIncidentAt: null,
    observations: [
      {
        id: "obs-ferry-fixture-1",
        observedAt: "2026-07-01T00:00:00+10:00",
        state: "current",
        evidenceClass: "synthetic_fixture",
        summary: "Synthetic accessible berth — not a live transport feed",
        sourceRef: "fixture:harbour-reliability-v1",
      },
    ],
    limitations: [
      "Not connected to a live transport API",
      "Service assignment expires with the trip (when live)",
    ],
    cannotForecastPreciseProbability: true,
    modelVersion: null,
    operatingMode: "synthetic",
  },
];

export function getHarbourReliabilityProfiles(): AccessReliabilityProfile[] {
  return HARBOUR_RELIABILITY_PROFILES.map((p) => ({
    ...p,
    observations: [...p.observations],
    limitations: [...p.limitations],
  }));
}
