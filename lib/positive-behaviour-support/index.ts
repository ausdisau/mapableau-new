export {
  PBS_POSITIONING,
  PBS_FORBIDDEN_CLAIMS,
  PBS_PLAN_STATUSES,
  PBS_PLAN_TYPES,
  PBS_ENGAGEMENT_STATUSES,
  PBS_SUITABILITY_STATUSES,
  PBS_QUESTIONNAIRE_SECTIONS,
  PBS_ANSWER_STATUSES,
  PBS_RP_CLASSIFICATIONS,
  PBS_RP_AUTHORISATION_STATUSES,
  PBS_ASSISTANCE_ACTIONS,
  PBS_PROHIBITED_ASSISTANCE_ACTIONS,
  PBS_EXTERNAL_FIELD_ALLOWLIST,
  PBS_EXTERNAL_FORBIDDEN_FIELD_KEYS,
} from "./types";
export type {
  PbsPlanStatus,
  PbsPlanType,
  PbsEngagementStatus,
  PbsSuitabilityStatus,
  PbsQuestionnaireSection,
  PbsAnswerStatus,
  PbsRpClassification,
  PbsRpAuthorisationStatus,
  PbsAssistanceAction,
  PbsProhibitedAssistanceAction,
  PbsAuthorityCeiling,
  PbsAccessActor,
  PbsAccessPurpose,
  PbsAccessDecision,
  PbsFinalisationChecklist,
  PbsAssistanceRequest,
  PbsAssistanceResult,
  PbsExternalPayloadField,
  PbsDeidentifiedPayload,
} from "./types";

export {
  canTransitionPbsPlanStatus,
  assertPbsPlanTransition,
  isPbsPlanTerminal,
  isPbsPlanVersionImmutable,
  listPbsPlanTransitions,
} from "./state-machine";

export {
  PBS_CORE_INVARIANTS,
  assertAssistanceActionAllowed,
  assertUnknownRemainsUnknown,
  assertQuestionnaireIsNotFba,
  assertDraftIsNotActivePlan,
  evaluateFinalisationGates,
  containsForbiddenPublicClaim,
  assertNoCapacityInferenceFromCommunicationStyle,
  isProhibitedAssistanceAction,
} from "./invariants";

export {
  evaluatePbsAccess,
  assertPbsAccess,
  toImplementingProviderView,
} from "./access";
export type { PbsGrantSnapshot, PbsEngagementAccessContext } from "./access";

export {
  sanitisePbsAuditMetadata,
  emitPbsAuditEvent,
  createPbsCorrelationId,
} from "./audit";

export {
  PBS_QUESTIONNAIRE_VERSION,
  PBS_QUESTIONNAIRE_DEFINITION,
  validateQuestionnaireResponse,
  unansweredSections,
  questionnaireCannotFinaliseAssessment,
} from "./questionnaire";

export {
  PBS_RP_CHECKLIST_VERSION,
  evaluateRestrictivePracticeGate,
  assertNoAiRestrictivePracticeAction,
} from "./restrictive-practice-gate";
export type {
  PbsRpChecklistAnswers,
  PbsRpGateResult,
} from "./restrictive-practice-gate";

export {
  DeterministicPbsAssistanceEngine,
  defaultPbsAssistanceEngine,
} from "./assistance-engine";
export type { PbsAssistanceEngine } from "./assistance-engine";

export {
  evaluateExternalModelPayload,
  validateExternalModelOutput,
  assertModelCannotWriteCanonicalPlan,
} from "./external-model-boundary";

export {
  transitionPbsPlanStatus,
  finalisePbsPlan,
  activatePbsPlan,
  assertPlanVersionMutable,
  assertNotClaimingDraftAsActive,
} from "./plan-lifecycle";

export { generatePbsExport } from "./export";
export type { PbsExportInput, PbsExportView, PbsExportResult } from "./export";

export {
  PBS_SOURCE_DESCRIPTORS,
  pbsSourcesReadyForHashSeed,
} from "./sources";
export type { PbsSourceDescriptor } from "./sources";

export {
  createPbsEngagement,
  createQuestionnaireSession,
  runPbsAssistance,
} from "./services";
