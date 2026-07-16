/**
 * Typed AURA-facing ContinuityOS tools (propose/explain only).
 * Deterministic services remain authoritative for classification, eligibility and execution.
 */

import { listLifeEventTypes, requireLifeEventType } from "@/lib/continuity-os/taxonomy/registry";
import { compareRecoveryOptions, type RecoveryOptionDraft } from "@/lib/continuity-os/recovery/options-engine";
import { getPlaybook } from "@/lib/continuity-os/recovery/playbooks";

export const CONTINUITY_OS_AI_TOOL_NAMES = [
  "identifyLifeEventType",
  "explainLifeEventTemplate",
  "readMissionDependencies",
  "explainDependencyFailure",
  "compareRecoveryOptions",
  "explainRecoveryCost",
  "draftParticipantQuestions",
  "prepareRecoveryProposal",
  "explainHandoffStatus",
  "summariseRecoveryReceipt",
  "prepareHumanNavigatorRequest",
  "explainRightsAndComplaintRoutes",
  "draftAccessibleContinuityPack",
] as const;

export type ContinuityOsAiToolName = (typeof CONTINUITY_OS_AI_TOOL_NAMES)[number];

/** Functions the model must never perform. */
export const CONTINUITY_OS_AI_PROHIBITED = [
  "final_failure_classification",
  "final_severity",
  "legal_rights_determination",
  "clinical_readiness",
  "service_eligibility",
  "provider_assignment",
  "worker_assignment",
  "transport_availability_confirmation",
  "refund_approval",
  "safeguarding_outcome",
  "emergency_response",
  "action_execution",
  "recovery_completion",
] as const;

export function identifyLifeEventTypeTool(input: { hint: string }) {
  const types = listLifeEventTypes();
  const hint = input.hint.toLowerCase();
  const matches = types.filter(
    (t) =>
      t.title.toLowerCase().includes(hint) ||
      t.code.includes(hint.replace(/\s+/g, "_")) ||
      t.plainLanguageDescription.toLowerCase().includes(hint)
  );
  return {
    suggestions: matches.slice(0, 5),
    note: "Suggestion only. Participant or valid authority must activate the life event.",
  };
}

export function explainLifeEventTemplateTool(input: { code: string }) {
  const definition = requireLifeEventType(input.code);
  return {
    title: definition.title,
    description: definition.plainLanguageDescription,
    warnings: definition.requiredWarnings,
    prohibitedAutomatedDecisions: definition.prohibitedAutomatedDecisions,
    note: "Template is a starting point — not every person needs every step.",
  };
}

export function compareRecoveryOptionsTool(options: RecoveryOptionDraft[]) {
  return {
    comparison: compareRecoveryOptions(options),
    note: "Deterministic eligibility already calculated. Model may explain only.",
  };
}

export function explainRightsAndComplaintRoutesTool(input: { playbookCode?: string }) {
  const playbook = input.playbookCode ? getPlaybook(input.playbookCode) : undefined;
  return {
    routes: playbook?.rightsAndComplaintRoutes ?? ["rights_centre", "provider_complaint"],
    note: "ContinuityOS does not determine legal liability or approve refunds.",
  };
}

export function draftParticipantQuestionsTool(input: { playbookCode: string }) {
  const playbook = getPlaybook(input.playbookCode);
  return {
    questions: playbook?.participantQuestions ?? [
      "What matters most to preserve from your original goal?",
      "Do you want a human coordinator?",
    ],
    mode: "one_question_at_a_time_supported",
  };
}
