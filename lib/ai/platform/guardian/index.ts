export {
  GUARDIAN_POLICY_VERSION,
  PROCESSING_SENSITIVITIES,
  PROCESSING_ZONES,
  GUARDIAN_DECISION_TYPES,
  POSSIBLE_SIGNAL_TYPES,
} from "./contracts";
export type {
  ProcessingSensitivity,
  ProcessingZone,
  GuardianDecisionType,
  PossibleSignalType,
  GuardianModelSignal,
  GuardianExplanation,
  GuardianDecision,
  GuardianEvaluateRequest,
  GuardianProcessingContext,
} from "./contracts";

export {
  GUARDIAN_REASON_CODES,
  isGuardianReasonCode,
} from "./reason-codes";
export type { GuardianReasonCode } from "./reason-codes";

export {
  DATA_CLASS_TO_SENSITIVITY,
  UNKNOWN_SENSITIVITY,
  sensitivityForDataClass,
  maxSensitivity,
  compareSensitivity,
  failUpward,
} from "./processing-sensitivity";

export {
  GUARDIAN_ALLOWED_PURPOSES,
  evaluatePurposePolicy,
  requiredConsentScopesForPurpose,
} from "./purpose-policy";
export type { GuardianPurpose, PurposePolicyResult } from "./purpose-policy";

export { evaluatePrivacyGate } from "./privacy-gate";
export type {
  PrivacyGateInput,
  PrivacyGateResult,
  AppStyleRoutingReceipt,
} from "./privacy-gate";

export { routeProcessing } from "./processing-router";
export type {
  ProcessingRouterInput,
  ProcessingRouterResult,
} from "./processing-router";

export {
  evaluateGuardianPolicy,
  guardianMayDecideReportability,
  guardianMaySubstantiateAllegation,
  guardianMayAuthoriseRestrictivePractice,
  guardianMayCloseIncidentOrComplaint,
} from "./guardian-policy";

export { evaluateGuardian } from "./guardian-service";
export type {
  GuardianServiceEvaluateInput,
  GuardianServiceResult,
} from "./guardian-service";

export { auditGuardianDecision } from "./audit";
export type { GuardianAuditInput } from "./audit";

export type { ProcessingProviderRecord, ProcessorType } from "./providers/contracts";
export {
  listProcessingProviders,
  getProcessingProvider,
  listApprovedProcessingProviders,
} from "./providers/registry";
export {
  selectEligibleProviders,
  providerAllowsSensitivity,
  providerAllowsDataClasses,
  providerAllowsPurpose,
  providerSupportsZone,
} from "./providers/policy";
