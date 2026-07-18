export { decisionStudioConfig } from "@/lib/config/decision-studio";

export * from "./types";
export {
  canTransitionDecisionState,
  assertDecisionTransition,
} from "./state-machine";
export {
  DecisionStudioError,
  assertDecisionStudioEnabled,
  assertSupporterCannotDecideAlone,
  createDecisionCase,
  createDecisionOption,
  createSupportSession,
  recordParticipantSelection,
  reverseDecision,
  transitionDecisionCase,
} from "./case";
export {
  assertNoProviderPaidRanking,
  buildDecisionComparison,
  sortOptionsNeutrally,
} from "./comparison";
export {
  buildWorkerReplacementPilot,
  draftDecisionExplanation,
} from "./worker-replacement";
