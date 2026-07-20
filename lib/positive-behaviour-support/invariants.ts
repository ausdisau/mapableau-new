import {
  PBS_FORBIDDEN_CLAIMS,
  PBS_PROHIBITED_ASSISTANCE_ACTIONS,
  type PbsAssistanceAction,
  type PbsFinalisationChecklist,
  type PbsProhibitedAssistanceAction,
} from "./types";

export const PBS_CORE_INVARIANTS = [
  "participant_primary_decision_maker",
  "supported_decision_making_not_incapacity",
  "communication_style_never_infers_capacity",
  "missing_information_remains_unknown",
  "ai_output_is_proposal_only",
  "questionnaire_is_not_fba",
  "draft_is_not_active_plan",
  "only_verified_assigned_practitioner_finalises",
  "participant_ack_not_rp_authorisation",
  "no_model_rp_recommend_approve_authorise_activate",
  "no_model_diagnose_function_trauma_readiness_safeguarding",
  "chat_never_only_pathway",
  "participant_may_correct_disagree_challenge",
  "delegated_access_explicit_scoped_revocable_time_limited",
  "sensitive_read_requires_receipt_and_audit",
  "no_sensitive_content_in_audit_metadata_telemetry_logs",
  "no_public_capability_claim_in_controlled_pilot",
] as const;

export type PbsCoreInvariant = (typeof PBS_CORE_INVARIANTS)[number];

export function isProhibitedAssistanceAction(
  action: string,
): action is PbsProhibitedAssistanceAction {
  return (PBS_PROHIBITED_ASSISTANCE_ACTIONS as readonly string[]).includes(
    action,
  );
}

export function assertAssistanceActionAllowed(
  action: PbsAssistanceAction | PbsProhibitedAssistanceAction | string,
): asserts action is PbsAssistanceAction {
  if (isProhibitedAssistanceAction(action)) {
    throw new Error(
      `PBS assistance action prohibited: ${action}. AI may not make clinical determinations or handle restrictive practices.`,
    );
  }
}

export function assertUnknownRemainsUnknown(
  answerStatus: string,
  inferredValue: unknown,
): void {
  if (answerStatus === "unknown" && inferredValue != null && inferredValue !== "") {
    throw new Error(
      "Missing information must remain unknown — inference from unknown answers is prohibited",
    );
  }
}

export function assertQuestionnaireIsNotFba(claim: string): void {
  const lowered = claim.toLowerCase();
  if (
    lowered.includes("functional behaviour assessment") ||
    lowered.includes("fba complete") ||
    lowered.includes("determined the function")
  ) {
    throw new Error(
      "A questionnaire is not a functional behaviour assessment and must not be claimed as one",
    );
  }
}

export function assertDraftIsNotActivePlan(
  planStatus: string,
  claimActive: boolean,
): void {
  if (claimActive && planStatus !== "active") {
    throw new Error(
      "A generated draft is not an active behaviour support plan",
    );
  }
}

export function evaluateFinalisationGates(
  checklist: PbsFinalisationChecklist,
): { ok: boolean; failures: string[] } {
  const failures: string[] = [];
  const entries = Object.entries(checklist) as Array<
    [keyof PbsFinalisationChecklist, boolean]
  >;
  for (const [key, value] of entries) {
    if (!value) failures.push(key);
  }
  return { ok: failures.length === 0, failures };
}

export function containsForbiddenPublicClaim(text: string): boolean {
  const lowered = text.toLowerCase();
  return PBS_FORBIDDEN_CLAIMS.some((claim) =>
    lowered.includes(claim.toLowerCase()),
  );
}

export function assertNoCapacityInferenceFromCommunicationStyle(
  usedCommunicationStyleToInferCapacity: boolean,
): void {
  if (usedCommunicationStyleToInferCapacity) {
    throw new Error(
      "Communication style must never be used to infer capacity",
    );
  }
}
