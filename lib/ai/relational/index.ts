export {
  RELATIONAL_CAPABILITY_KEYS,
  RELATIONAL_POLICY_VERSION,
  isRelationalCapabilityKey,
} from "./types";
export type {
  RelationalCapabilityKey,
  RelationalDenialCode,
  RelationalDenialState,
  RelationalGateContext,
  RelationalGateResult,
  RelationalGovernedEnvelope,
} from "./types";

export {
  RELATIONAL_PROHIBITED_OPERATIONAL_CAPABILITIES,
  RELATIONAL_PROHIBITED_INFERENCES,
  isProhibitedOperationalCapability,
  isProhibitedInference,
  assertNotProhibitedOperational,
  assertNotProhibitedInference,
} from "./prohibitions";

export {
  assertRelationalCapability,
  rejectProhibitedInference,
  RELATIONAL_AUDIT,
} from "./gates";

export { validateRelationalGovernedEnvelope } from "./envelope";
export type { EnvelopeValidationResult } from "./envelope";

export { buildRelationalDenialState } from "./denial-ux";

export {
  RELATIONAL_INTELLIGENCE_FLAGS,
  relationalIntelligenceConfig,
  isRelationalFeatureFlagEnabled,
  isRelationalIntelligenceKilled,
} from "@/lib/config/relational-intelligence";
