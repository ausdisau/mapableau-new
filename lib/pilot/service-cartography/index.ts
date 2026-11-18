export {
  isServiceCartographyPilotEnabled,
  isServiceCartographySimulateEnabled,
  isServiceCartographySyntheticOnly,
  serviceCartographyConfig,
} from "@/lib/config/service-cartography";

export {
  clearAdvisoryOutcomeLog,
  createSyntheticCartographyAdapter,
  MAX_ADVISORY_OUTCOME_LOG,
  readAdvisoryOutcomeLog,
} from "./adapter";
export {
  CARTOGRAPHY_AT,
  CARTOGRAPHY_GOAL_REF,
  CARTOGRAPHY_PARTICIPANT_ID,
  syntheticNeeds,
  syntheticScenario,
} from "./fixtures";
export { runGoldenSlice } from "./golden-slice";
export type { CartographyGoldenSlice, GoldenSliceInput } from "./golden-slice";
export {
  CARTOGRAPHY_FAILURE_MODES,
  SERVICE_CARTOGRAPHY_PROHIBITIONS,
} from "./types";
export type {
  CartographyAdapter,
  CartographyCallerContext,
  CartographyFailureMode,
} from "./types";
