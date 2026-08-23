import type {
  AutonomyMode,
  ExperimentResult,
  LabScenario,
  ScenarioState,
} from "@/lib/labs/contracts";
import { LABS_SIMULATION_DATA } from "@/lib/labs/contracts";

import {
  createInitialScenarioState,
  reduceScenario,
  type ScenarioCommand,
} from "./reducer";

export type ScenarioEngine = {
  getState: () => ScenarioState;
  dispatch: (command: ScenarioCommand) => ScenarioState;
  getResult: (experimentId: string) => ExperimentResult | null;
};

export function createScenarioEngine(
  scenario: LabScenario,
  initialMode: AutonomyMode = "INFORM",
): ScenarioEngine {
  let state = createInitialScenarioState(scenario, initialMode);

  return {
    getState: () => state,
    dispatch: (command) => {
      state = reduceScenario(state, command, scenario);
      return state;
    },
    getResult: (experimentId) => {
      if (state.phase !== "COMPLETED" || !state.completedAt) return null;
      return {
        runId: state.runId,
        experimentId,
        autonomyMode: state.autonomyMode,
        choices: state.choices,
        agencyTimeline: state.agencyTimeline,
        feedback: state.feedback,
        completedAt: state.completedAt,
        labsSimulationData: LABS_SIMULATION_DATA,
      };
    },
  };
}

export { createInitialScenarioState, reduceScenario };
export type { ScenarioCommand };
