import { randomUUID } from "crypto";

import { auraFlags } from "../feature-flags";

export type CivicAccessTwin = {
  id: string;
  regionId: string;
  entities: {
    type: string;
    id: string;
    label: string;
    status: string;
    source?: string;
  }[];
  generatedAt: string;
  individualJourneysExposed: false;
  simulated: boolean;
};

export type RegionalAccessTwin = {
  id: string;
  regionId: string;
  hubLabel: string;
  spokeCount: number;
  coverageGaps: string[];
  thinMarketSignalSummaries: string[];
  smallCellSuppressed: true;
  participantIdentitiesExposed: false;
  generatedAt: string;
};

export type InfrastructureScenario = {
  id: string;
  regionId: string;
  label: string;
  baseline: string;
  proposedChange: string;
  assumptions: string[];
  evidenceCoverage: number;
  syntheticProfilesTested: string[];
  journeysImproved: number;
  journeysWorsened: number;
  newlyBlocked: number;
  newlyUnknown: number;
  affectedRegions: string[];
  confidence: number;
  limitations: string[];
  bestOptionClaim: false;
  participantScore: null;
  legalComplianceClaim: false;
};

const civic = new Map<string, CivicAccessTwin>();
const regional = new Map<string, RegionalAccessTwin>();
const scenarios = new Map<string, InfrastructureScenario>();

export function resetCivicRegionalStore(): void {
  civic.clear();
  regional.clear();
  scenarios.clear();
}

export function buildCivicAccessTwin(input: {
  regionId: string;
  simulated?: boolean;
}): CivicAccessTwin {
  if (
    !auraFlags.civicAccessTwinEnabled &&
    process.env.NODE_ENV !== "test"
  ) {
    throw new Error("MAPABLE_CIVIC_ACCESS_TWIN_DISABLED");
  }
  const twin: CivicAccessTwin = {
    id: randomUUID(),
    regionId: input.regionId,
    entities: [
      {
        type: "public_building",
        id: "place-harbour-civic",
        label: "Harbour Civic Centre",
        status: "open",
        source: "AccessPlace",
      },
      {
        type: "transport_interchange",
        id: "central-station",
        label: "Central Station",
        status: "open",
        source: "gtfs_fixture",
      },
      {
        type: "curb_zone",
        id: "curb-harbour-plz",
        label: "Harbour loading zone",
        status: "open",
      },
      {
        type: "lift",
        id: "hcc-lift-west",
        label: "Western lift",
        status: "operational",
      },
    ],
    generatedAt: new Date().toISOString(),
    individualJourneysExposed: false,
    simulated: input.simulated ?? true,
  };
  civic.set(twin.id, twin);
  return twin;
}

export function buildRegionalAccessTwin(input: {
  regionId: string;
  hubLabel: string;
}): RegionalAccessTwin {
  if (
    !auraFlags.regionalAccessTwinEnabled &&
    process.env.NODE_ENV !== "test"
  ) {
    throw new Error("MAPABLE_REGIONAL_ACCESS_TWIN_DISABLED");
  }
  const twin: RegionalAccessTwin = {
    id: randomUUID(),
    regionId: input.regionId,
    hubLabel: input.hubLabel,
    spokeCount: 3,
    coverageGaps: ["evening Entrance B hours", "alternative lift route"],
    thinMarketSignalSummaries: [
      "Aggregated capacity gap (small cells suppressed)",
    ],
    smallCellSuppressed: true,
    participantIdentitiesExposed: false,
    generatedAt: new Date().toISOString(),
  };
  regional.set(twin.id, twin);
  return twin;
}

export function runInfrastructureSimulation(input: {
  regionId: string;
  label: string;
  proposedChange: string;
  assumptions: string[];
}): InfrastructureScenario {
  if (
    !auraFlags.infrastructureSimulatorEnabled &&
    process.env.NODE_ENV !== "test"
  ) {
    throw new Error("MAPABLE_INFRASTRUCTURE_SIMULATOR_DISABLED");
  }
  const scenario: InfrastructureScenario = {
    id: randomUUID(),
    regionId: input.regionId,
    label: input.label,
    baseline: "Current Harbour Civic access profile",
    proposedChange: input.proposedChange,
    assumptions: input.assumptions,
    evidenceCoverage: 0.72,
    syntheticProfilesTested: [
      "fixture-wheelchair",
      "fixture-low-vision",
      "fixture-fatigue",
    ],
    journeysImproved: 18,
    journeysWorsened: 0,
    newlyBlocked: 0,
    newlyUnknown: 4,
    affectedRegions: [input.regionId],
    confidence: 0.65,
    limitations: [
      "Synthetic profiles are not prevalence estimates",
      "Does not claim objective moral certainty",
      "Not legal compliance certification",
    ],
    bestOptionClaim: false,
    participantScore: null,
    legalComplianceClaim: false,
  };
  scenarios.set(scenario.id, scenario);
  return scenario;
}
