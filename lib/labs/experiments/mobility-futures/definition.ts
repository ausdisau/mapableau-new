import type { LabExperiment, LabScenario } from "@/lib/labs/contracts";
import { LABS_SIMULATION_DATA } from "@/lib/labs/contracts";

export const MOBILITY_FUTURES_EXPERIMENT_ID = "mobility-futures-p0";
export const MOBILITY_FUTURES_SCENARIO_ID = "mobility-futures-routine-journey";

export const mobilityFuturesExperiment: LabExperiment = {
  id: MOBILITY_FUTURES_EXPERIMENT_ID,
  slug: "mobility-futures",
  title: "Mobility Futures Lab",
  summary:
    "Experience a simulated journey under Inform, Suggest, Assist and Compare autonomy modes. Simulation only — no real mobility device control.",
  status: "DEMONSTRATION",
  environmentMode: "SIMULATION",
  scenarioId: MOBILITY_FUTURES_SCENARIO_ID,
  labsSimulationData: LABS_SIMULATION_DATA,
};

export const mobilityFuturesScenario: LabScenario = {
  id: MOBILITY_FUTURES_SCENARIO_ID,
  title: "Home to café — synthetic journey",
  labsSimulationData: LABS_SIMULATION_DATA,
  nodes: [
    {
      id: "home",
      label: "Home",
      kind: "HOME",
      description: "Starting point. Simulated departure only.",
    },
    {
      id: "path",
      label: "Path",
      kind: "PATH",
      description: "Footpath segment toward the crossing.",
    },
    {
      id: "crossing",
      label: "Crossing",
      kind: "CROSSING",
      description: "Road crossing before the station approach.",
    },
    {
      id: "station",
      label: "Station",
      kind: "STATION",
      description: "Transit station entrance area.",
    },
    {
      id: "lift",
      label: "Lift",
      kind: "LIFT",
      description: "Station lift used in the planned simulated route.",
    },
    {
      id: "cafe",
      label: "Café",
      kind: "CAFE",
      description: "Destination café. Journey complete when reached.",
    },
  ],
  path: ["home", "path", "crossing", "station", "lift", "cafe"],
  eventsByNodeId: {
    path: [
      {
        id: "evt-obstruction",
        type: "TEMPORARY_OBSTRUCTION",
        nodeId: "path",
        title: "Temporary obstruction",
        description:
          "A simulated temporary obstruction is reported on the path ahead.",
        evidenceState: "SENSOR_SIMULATED",
        requiresDecision: true,
      },
    ],
    crossing: [
      {
        id: "evt-unknown",
        type: "UNKNOWN_ROUTE_SEGMENT",
        nodeId: "crossing",
        title: "Unknown route segment",
        description:
          "Crossing accessibility evidence is unknown in this simulation.",
        evidenceState: "UNKNOWN",
        requiresDecision: true,
      },
    ],
    lift: [
      {
        id: "evt-lift",
        type: "LIFT_OUTAGE",
        nodeId: "lift",
        title: "Lift outage",
        description:
          "The planned lift is reported unavailable in the simulation.",
        evidenceState: "KNOWN",
        requiresDecision: true,
      },
    ],
  },
};

export const FEEDBACK_QUESTIONS = [
  "Was that what you expected?",
  "Who should have decided?",
  "Would you allow this in the real world?",
] as const;
