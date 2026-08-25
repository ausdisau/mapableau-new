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

export {
  RELATIONAL_CONSTITUTION_VERSION,
  RELATIONAL_CONSTITUTION_RULES,
  RELATIONAL_CONSTITUTION_CHANGE_CONTROL,
  getRelationalConstitutionRule,
  listRelationalConstitutionRules,
} from "./constitution";
export type {
  RelationalConstitutionRule,
  RelationalConstitutionRuleClass,
} from "./constitution";

export {
  RELATIONAL_CONSENT_PURPOSES,
  RELATIONAL_SERVICE_CONSENT_PURPOSES,
  RELATIONAL_TRAINING_CONSENT_PURPOSE,
  isRelationalConsentPurpose,
  isRelationalTrainingConsentPurpose,
  isRelationalServiceConsentPurpose,
  assertConsentPurposeUsable,
} from "./consent-purposes";
export type { RelationalConsentPurpose } from "./consent-purposes";

export {
  ASSISTANCE_MODES,
  PARTICIPANT_CONTROLS,
  IMMEDIATE_STOP_CONTROLS,
  ALLOWED_RESPONSE_CLASSES,
  assistanceModeSchema,
  participantControlSchema,
  communicationPreferenceSchema,
  explicitSelfReportSchema,
  structuredInterpretationSchema,
  decisionPassportSchema,
  relationalPolicyDecisionSchema,
  isImmediateStopControl,
  isCommunicationPreferenceExpired,
  canConfirmInterpretation,
  applyInterpretationCorrection,
  decideImmediateControl,
  policyForLongPause,
} from "./contracts";
export type {
  AssistanceMode,
  ParticipantControl,
  RelationalCommunicationPreference,
  ExplicitSelfReport,
  StructuredInterpretation,
  ConfirmationState,
  RelationalDecisionPassport,
  RelationalPolicyDecision,
  AllowedResponseClass,
} from "./contracts";

export { RELATIONAL_CONTRACT_FIXTURES } from "./fixtures";
