export {
  COMPATIBILITY_RESULTS,
  COMPATIBILITY_RESULT_LABELS,
  accessRequirementsSchema,
  type AccessRequirements,
  type CompatibilityEvaluation,
  type CompatibilityResult,
  type CompatibilityRuleEvaluation,
} from "./contracts";
export { evaluateCompatibility } from "./evaluate";
export {
  isSupportedMobilityAidType,
  mobilityProfileToAccessRequirements,
  SUPPORTED_MOBILITY_AID_TYPES,
} from "./adapters/mobility-profile";
