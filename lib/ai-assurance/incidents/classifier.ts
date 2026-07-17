/**
 * Incident classifier for AURA-derived events. AURA does not decide
 * reportability by itself — it flags candidates for a human to review.
 */

export type AuraIncidentCandidateKind =
  | "authority_bypass_suspected"
  | "consent_bypass_suspected"
  | "unbounded_loop_detected"
  | "compensation_failed"
  | "execution_unknown_unresolved"
  | "prompt_injection_attempt"
  | "prohibited_tool_call_attempt"
  | "kill_switch_release_attempt";

export interface IncidentCandidate {
  kind: AuraIncidentCandidateKind;
  auraEntityRef: string;
  narrative: string;
  humanReviewRequired: true;
}

export function isReportabilityDecidedByAura(): false {
  // AURA never decides reportability. Reportability decisions are always human.
  return false;
}

export function classifyToCandidate(
  kind: AuraIncidentCandidateKind,
  narrative: string,
  entityRef: string
): IncidentCandidate {
  return {
    kind,
    auraEntityRef: entityRef,
    narrative,
    humanReviewRequired: true,
  };
}
