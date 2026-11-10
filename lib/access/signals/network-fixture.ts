/**
 * Fictional precinct network — coordinates are synthetic only.
 * Never present as real place ratings or verified live services.
 */
import type {
  RagFeatureAssessmentInput,
  RagRouteAssessmentInput,
} from "./types";

export type SyntheticZone = {
  id: string;
  name: string;
  /** Synthetic map position 0–100 */
  x: number;
  y: number;
  featureId: string;
};

export type SyntheticEdge = {
  id: string;
  fromZoneId: string;
  toZoneId: string;
  featureId: string;
};

export type SyntheticNetwork = {
  precinctName: string;
  disclosure: string;
  zones: SyntheticZone[];
  edges: SyntheticEdge[];
  features: RagFeatureAssessmentInput[];
  routes: RagRouteAssessmentInput[];
};

export function makeSyntheticNetwork(): SyntheticNetwork {
  const features: RagFeatureAssessmentInput[] = [
    {
      featureId: "feat-plaza-path",
      label: "Plaza continuous path",
      domain: "paths",
      applicability: "applicable",
      critical: true,
      barrierPresent: false,
      observations: [
        {
          id: "obs-plaza-1",
          featureKey: "path_width_mm",
          domain: "paths",
          value: 1800,
          observedAt: "2026-10-01T00:00:00.000Z",
          flags: ["assessor_observed", "verified", "synthetic"],
        },
      ],
      operationalConditions: [],
    },
    {
      featureId: "feat-kerb-missing",
      label: "Harbour crossing kerb ramp",
      domain: "crossings",
      applicability: "applicable",
      critical: true,
      barrierPresent: true,
      observations: [
        {
          id: "obs-kerb-1",
          featureKey: "kerb_ramp_present",
          domain: "crossings",
          value: false,
          observedAt: "2026-09-15T00:00:00.000Z",
          flags: ["assessor_observed", "synthetic"],
          notes: "Synthetic barrier for demo.",
        },
      ],
      operationalConditions: [],
      verifiedAlternativeIds: ["route-via-plaza"],
    },
    {
      featureId: "feat-ramp-community",
      label: "Side entry ramp",
      domain: "ramps",
      applicability: "applicable",
      critical: false,
      barrierPresent: false,
      documentedConditions: ["Assistance may be needed on steeper approach"],
      observations: [
        {
          id: "obs-ramp-1",
          featureKey: "ramp_grade",
          domain: "ramps",
          value: "community_estimate",
          observedAt: "2026-08-01T00:00:00.000Z",
          flags: ["community_reported", "synthetic"],
        },
      ],
      operationalConditions: [],
    },
    {
      featureId: "feat-toilet-unknown",
      label: "Plaza sanitary facility",
      domain: "amenities",
      applicability: "applicable",
      critical: false,
      barrierPresent: false,
      observations: [],
      operationalConditions: [],
    },
    {
      featureId: "feat-lift-outage",
      label: "Station lift A",
      domain: "vertical",
      applicability: "applicable",
      critical: true,
      barrierPresent: false,
      observations: [
        {
          id: "obs-lift-1",
          featureKey: "lift_operational",
          domain: "vertical",
          value: false,
          observedAt: "2026-11-01T00:00:00.000Z",
          flags: ["assessor_observed", "synthetic"],
        },
      ],
      operationalConditions: [
        {
          id: "op-lift-1",
          label: "Lift offline for maintenance (synthetic)",
          temporary: true,
          kind: "temporary_outage",
        },
      ],
    },
    {
      featureId: "feat-decorative-na",
      label: "Decorative water feature",
      domain: "amenity_other",
      applicability: "not_applicable",
      notApplicableReason: "Not part of the accessible path of travel.",
      critical: false,
      barrierPresent: false,
      observations: [],
      operationalConditions: [],
    },
  ];

  const zones: SyntheticZone[] = [
    { id: "zone-plaza", name: "Civic Plaza", x: 30, y: 40, featureId: "feat-plaza-path" },
    { id: "zone-harbour", name: "Harbour Crossing", x: 70, y: 35, featureId: "feat-kerb-missing" },
    { id: "zone-side", name: "Side Entry", x: 50, y: 70, featureId: "feat-ramp-community" },
    { id: "zone-station", name: "Station Lift", x: 20, y: 75, featureId: "feat-lift-outage" },
  ];

  const edges: SyntheticEdge[] = [
    {
      id: "edge-plaza-harbour",
      fromZoneId: "zone-plaza",
      toZoneId: "zone-harbour",
      featureId: "feat-kerb-missing",
    },
    {
      id: "edge-plaza-side",
      fromZoneId: "zone-plaza",
      toZoneId: "zone-side",
      featureId: "feat-ramp-community",
    },
    {
      id: "edge-side-station",
      fromZoneId: "zone-side",
      toZoneId: "zone-station",
      featureId: "feat-lift-outage",
    },
  ];

  const routes: RagRouteAssessmentInput[] = [
    {
      routeId: "route-direct-harbour",
      label: "Plaza → Harbour (direct)",
      segmentFeatureIds: ["feat-plaza-path", "feat-kerb-missing"],
      networkComplete: true,
    },
    {
      routeId: "route-via-plaza",
      label: "Plaza → Side → Station (alternative)",
      segmentFeatureIds: ["feat-plaza-path", "feat-ramp-community", "feat-lift-outage"],
      networkComplete: true,
    },
    {
      routeId: "route-incomplete",
      label: "Incomplete edge stub",
      segmentFeatureIds: ["feat-plaza-path"],
      networkComplete: false,
    },
  ];

  return {
    precinctName: "Synthetic Harbour Precinct",
    disclosure:
      "Fictional network for Access Signals review only. Not a real place, not published ratings, not a compliance certificate.",
    zones,
    edges,
    features,
    routes,
  };
}
