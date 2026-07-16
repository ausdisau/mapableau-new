export { explainDecision } from "./calculate-personal-fit";
export {
  calculatePersonalFitDecision,
  type FitEngineInput,
} from "./calculate-personal-fit";
export { evaluateRequirement } from "./evaluate-requirement";
export {
  calculateEvidenceConfidence,
  calculateLiveReliability,
} from "./calculate-confidence";
export type {
  AlternativeOption,
  DecisionFinding,
  ExplainedAccessDecision,
} from "./types";

import { calculatePersonalFitDecision, explainDecision } from "./calculate-personal-fit";
import type { FitEngineInput } from "./calculate-personal-fit";

/** Primary entry: deterministic evaluate → explained decision. */
export function evaluateAccessDecision(input: FitEngineInput) {
  const decision = calculatePersonalFitDecision(input);
  return explainDecision(decision);
}
