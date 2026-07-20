export { PBS_POSITIONING, PBS_FORBIDDEN_CLAIMS } from "./types";
export type * from "./types";

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
