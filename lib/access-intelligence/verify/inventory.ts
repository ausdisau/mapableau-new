import { getDemoGraph, DEMO_GRAPHS } from "@/lib/access-intelligence/demo-data";
import { calculateAccessCoverage } from "@/lib/access-intelligence/living/coverage";
import {
  HARBOUR_PLACE_ID,
  buildHarbourLivingTwin,
  MAIN_LIFT_OUTAGE_INCIDENT,
} from "@/lib/access-intelligence/living/harbour-civic";
import { getAccessStateAt } from "@/lib/access-intelligence/living/temporal";
import type { AccessFeature, Evidence, LiveIncident } from "@/lib/access-intelligence/schemas";

export type VerifyVenueSummary = {
  placeId: string;
  name: string;
  address: string;
  fictional: boolean;
  elementCount: number;
  featureCount: number;
  evidenceCount: number;
  activeIncidentCount: number;
  staleEvidenceCount: number;
  disputedFeatureCount: number;
  unknownOpsCount: number;
};

export type VerifyInventory = {
  placeId: string;
  placeName: string;
  fictionalNotice: string;
  elements: Array<{ id: string; type: string; name: string; level?: string }>;
  features: AccessFeature[];
  evidence: Evidence[];
  incidents: LiveIncident[];
  staleEvidence: Evidence[];
  disputedFeatures: AccessFeature[];
  unknownFeatures: AccessFeature[];
  coverage: ReturnType<typeof calculateAccessCoverage>;
  temporaryRoute?: { text: string };
  stateNotes: string[];
};

function twinFor(placeId: string) {
  if (placeId === HARBOUR_PLACE_ID || placeId === "place-harbour-civic") {
    return buildHarbourLivingTwin({
      incidents: [{ ...MAIN_LIFT_OUTAGE_INCIDENT, status: "active" }],
    });
  }
  const graph = getDemoGraph(placeId);
  if (!graph) return null;
  return {
    place: graph.place,
    elements: graph.elements,
    features: graph.features,
    evidence: graph.evidence,
    nodes: graph.nodes,
    edges: graph.edges,
    incidents: [] as LiveIncident[],
    operatingRules: [],
    destinations: graph.nodes
      .filter((n) => n.nodeType === "room")
      .map((n) => ({ id: n.id, nodeId: n.id, label: n.label, level: n.level })),
    version: "demo-1",
    updatedAt: new Date().toISOString(),
    fictionalNotice: `${graph.place.name} is demonstration data and not a real venue.`,
  };
}

export function listVerifyVenues(): VerifyVenueSummary[] {
  const harbour = buildHarbourLivingTwin({
    incidents: [{ ...MAIN_LIFT_OUTAGE_INCIDENT, status: "active" }],
  });
  const summaries: VerifyVenueSummary[] = [
    {
      placeId: harbour.place.id,
      name: harbour.place.name,
      address: harbour.place.address,
      fictional: true,
      elementCount: harbour.elements.length,
      featureCount: harbour.features.length,
      evidenceCount: harbour.evidence.length,
      activeIncidentCount: harbour.incidents.filter((i) => i.status === "active").length,
      staleEvidenceCount: harbour.evidence.filter((e) => e.capturedAt < "2026-01-01").length,
      disputedFeatureCount: harbour.features.filter((f) => f.disputed).length,
      unknownOpsCount: harbour.features.filter(
        (f) => f.value === "unknown" || f.value === "unknown_operational",
      ).length,
    },
  ];

  for (const g of DEMO_GRAPHS) {
    if (g.place.id === harbour.place.id) continue;
    summaries.push({
      placeId: g.place.id,
      name: g.place.name,
      address: g.place.address,
      fictional: true,
      elementCount: g.elements.length,
      featureCount: g.features.length,
      evidenceCount: g.evidence.length,
      activeIncidentCount: 0,
      staleEvidenceCount: g.evidence.filter((e) => e.status === "expired" || e.capturedAt < "2025-01-01")
        .length,
      disputedFeatureCount: g.features.filter((f) => f.disputed).length,
      unknownOpsCount: g.features.filter(
        (f) => f.value === "unknown" || f.value === "unknown_operational",
      ).length,
    });
  }
  return summaries;
}

export function getVerifyInventory(
  placeId: string,
  visitAt = "2026-07-16T00:00:00.000Z",
): VerifyInventory | null {
  const twin = twinFor(placeId);
  if (!twin) return null;
  const state =
    "operatingRules" in twin && twin.operatingRules
      ? getAccessStateAt(twin as ReturnType<typeof buildHarbourLivingTwin>, visitAt)
      : { notes: [] as string[], activeIncidents: twin.incidents };

  const staleEvidence = twin.evidence.filter(
    (e) => e.status === "expired" || e.capturedAt < "2026-01-01",
  );
  const disputedFeatures = twin.features.filter((f) => f.disputed);
  const unknownFeatures = twin.features.filter(
    (f) => f.value === "unknown" || f.value === "unknown_operational",
  );

  const coverage: ReturnType<typeof calculateAccessCoverage> =
    placeId === HARBOUR_PLACE_ID || placeId === "place-harbour-civic"
      ? calculateAccessCoverage({
          twin: twin as ReturnType<typeof buildHarbourLivingTwin>,
          visitAt,
        })
      : {
          testedProfileCount: 0,
          suitable: 0,
          suitableWithConditions: 0,
          blocked: 0,
          unknown: 0,
          results: [],
          topBlockers: [],
          topUnknowns: [],
          note: "Access Coverage is seeded for Harbour Civic Centre Living Twin in this demonstration.",
        };

  return {
    placeId: twin.place.id,
    placeName: twin.place.name,
    fictionalNotice: twin.fictionalNotice,
    elements: twin.elements.map((e) => ({
      id: e.id,
      type: e.type,
      name: e.name,
      level: e.level,
    })),
    features: twin.features,
    evidence: twin.evidence,
    incidents: twin.incidents,
    staleEvidence,
    disputedFeatures,
    unknownFeatures,
    coverage,
    temporaryRoute:
      placeId === HARBOUR_PLACE_ID || placeId === "place-harbour-civic"
        ? {
            text: "Reception → Western lift → western corridor → main corridor → Room 3.12",
          }
        : undefined,
    stateNotes: "notes" in state ? state.notes : [],
  };
}
