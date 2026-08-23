import type { AutonomyMode } from "./autonomy";
import type { AgencyEvent, DecisionPoint, ParticipantChoice } from "./agency";
import { LABS_SIMULATION_DATA } from "./experiment";

export const SCENARIO_PHASES = [
  "IDLE",
  "RUNNING",
  "DECISION_REQUIRED",
  "PAUSED",
  "COMPLETED",
] as const;

export type ScenarioPhase = (typeof SCENARIO_PHASES)[number];

export const SCENARIO_COMMANDS = [
  "START",
  "EVENT",
  "DECISION_REQUIRED",
  "PARTICIPANT_CHOICE",
  "CONTINUE",
  "PAUSE",
  "COMPLETE",
  "RESET",
  "REPLAY",
] as const;

export type ScenarioCommandType = (typeof SCENARIO_COMMANDS)[number];

export const SCENARIO_EVENT_TYPES = [
  "TEMPORARY_OBSTRUCTION",
  "UNKNOWN_ROUTE_SEGMENT",
  "LIFT_OUTAGE",
  "ARRIVE_NODE",
  "JOURNEY_COMPLETE",
] as const;

export type ScenarioEventType = (typeof SCENARIO_EVENT_TYPES)[number];

export type ScenarioNode = {
  id: string;
  label: string;
  kind: "HOME" | "PATH" | "CROSSING" | "STATION" | "LIFT" | "CAFE" | "OTHER";
  description: string;
};

export type ScenarioEvent = {
  id: string;
  type: ScenarioEventType;
  nodeId: string;
  title: string;
  description: string;
  evidenceState: "KNOWN" | "UNKNOWN" | "SENSOR_SIMULATED";
  requiresDecision: boolean;
};

export type LabScenario = {
  id: string;
  title: string;
  nodes: ScenarioNode[];
  /** Ordered node ids for the journey path. */
  path: string[];
  eventsByNodeId: Record<string, ScenarioEvent[]>;
  labsSimulationData: typeof LABS_SIMULATION_DATA;
};

export type ScenarioFeedback = {
  id: string;
  decisionPointId: string;
  question: string;
  response?: string;
  timestamp: string;
};

export type ScenarioState = {
  scenarioId: string;
  phase: ScenarioPhase;
  autonomyMode: AutonomyMode;
  presentationMode: "STANDARD_VISUAL" | "SIMPLIFIED_2D" | "TEXT";
  pathIndex: number;
  currentNodeId: string | null;
  pendingDecision: DecisionPoint | null;
  pendingEvent: ScenarioEvent | null;
  choices: ParticipantChoice[];
  agencyTimeline: AgencyEvent[];
  feedback: ScenarioFeedback[];
  runId: string;
  startedAt: string | null;
  completedAt: string | null;
  labsSimulationData: typeof LABS_SIMULATION_DATA;
};

export type ExperimentResult = {
  runId: string;
  experimentId: string;
  autonomyMode: AutonomyMode;
  choices: ParticipantChoice[];
  agencyTimeline: AgencyEvent[];
  feedback: ScenarioFeedback[];
  completedAt: string;
  labsSimulationData: typeof LABS_SIMULATION_DATA;
};
