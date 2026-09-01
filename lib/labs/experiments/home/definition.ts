import type { LabExperiment, LabScenario } from "@/lib/labs/contracts";
import { LABS_SIMULATION_DATA } from "@/lib/labs/contracts";

export const HOME_LAB_EXPERIMENT_ID = "home-lab-p0";
export const HOME_LAB_SCENARIO_ID = "home-lab-leaving-home";

export const homeLabExperiment: LabExperiment = {
  id: HOME_LAB_EXPERIMENT_ID,
  slug: "home",
  title: "MapAble Home Lab",
  summary:
    "Explore how your home should respond when you prepare to leave. Simulation only — synthetic home data, no physical device control.",
  status: "DEMONSTRATION",
  environmentMode: "SIMULATION",
  scenarioId: HOME_LAB_SCENARIO_ID,
  labsSimulationData: LABS_SIMULATION_DATA,
};

export const homeLabScenario: LabScenario = {
  id: HOME_LAB_SCENARIO_ID,
  title: "Preparing to leave home — synthetic scenario",
  labsSimulationData: LABS_SIMULATION_DATA,
  nodes: [
    {
      id: "home",
      label: "Home",
      kind: "HOME",
      description: "You are at home and preparing to leave.",
    },
    {
      id: "path",
      label: "Observe",
      kind: "PATH",
      description: "Review hallway light, door, charger and lift state.",
    },
    {
      id: "crossing",
      label: "Respond",
      kind: "CROSSING",
      description: "Choose how the home should respond under the selected mode.",
    },
    {
      id: "cafe",
      label: "Reflect",
      kind: "CAFE",
      description: "Say what felt right and whether you stayed in control.",
    },
  ],
  path: ["home", "path", "crossing", "cafe"],
  eventsByNodeId: {
    path: [
      {
        id: "evt-unknown-lift",
        type: "UNKNOWN_ROUTE_SEGMENT",
        nodeId: "path",
        title: "Lift state unknown",
        description:
          "Building lift availability is UNKNOWN in this simulation. MapAble will not treat unknown as available.",
        evidenceState: "UNKNOWN",
        requiresDecision: false,
      },
    ],
  },
};

export const HOME_RESPONSE_MODES = [
  "REPORT_ONLY",
  "RECOMMEND",
  "PREPARE_AND_ASK",
  "BOUNDED_AUTO",
] as const;

export type HomeResponseMode = (typeof HOME_RESPONSE_MODES)[number];

export const HOME_RESPONSE_MODE_LABELS: Record<HomeResponseMode, string> = {
  REPORT_ONLY: "Mode A — Report only",
  RECOMMEND: "Mode B — Recommend",
  PREPARE_AND_ASK: "Mode C — Prepare and ask",
  BOUNDED_AUTO: "Mode D — Bounded automatic",
};

export const HOME_RESPONSE_MODE_DESCRIPTIONS: Record<HomeResponseMode, string> =
  {
    REPORT_ONLY: "The home only reports state. Nothing is suggested or changed.",
    RECOMMEND: "The home recommends actions. You decide whether anything happens.",
    PREPARE_AND_ASK: "The home prepares actions and asks before any change.",
    BOUNDED_AUTO:
      "The home may run only explicitly pre-authorised low-risk simulated actions.",
  };

export const HOME_LAB_CLAIM_LABELS = [
  "SIMULATION",
  "PUBLIC EXPERIMENT",
  "NO PHYSICAL DEVICE CONTROL",
  "SYNTHETIC HOME DATA",
] as const;

export const HOME_LAB_FEEDBACK_PROMPTS = [
  {
    question: "Was that what you expected?",
    answers: ["Yes", "No", "Not sure"],
  },
  {
    question: "Which actions should always ask?",
    answers: [
      "Lights",
      "Door lock",
      "Blinds",
      "All of them",
      "None of them",
      "Not sure",
    ],
  },
  {
    question: "Which actions could happen automatically?",
    answers: [
      "Hallway light",
      "None",
      "Only ones I pre-authorise",
      "Not sure",
    ],
  },
  {
    question: "When would your answer change?",
    answers: [
      "If a support worker is present",
      "At night",
      "When I am tired or overloaded",
      "Never",
      "Not sure",
    ],
  },
  {
    question: "Did you remain in control?",
    answers: ["Yes", "Mostly", "No", "Not sure"],
  },
] as const;
