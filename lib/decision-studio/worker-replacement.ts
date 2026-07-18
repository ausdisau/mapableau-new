import { decisionStudioConfig } from "@/lib/config/decision-studio";

import {
  buildDecisionComparison,
  sortOptionsNeutrally,
} from "./comparison";
import {
  assertDecisionStudioEnabled,
  createDecisionCase,
  createDecisionOption,
  transitionDecisionCase,
} from "./case";
import type {
  DecisionCase,
  DecisionComparison,
  DecisionOption,
} from "./types";

export type WorkerReplacementPilot = {
  decisionCase: DecisionCase;
  options: DecisionOption[];
  comparison: DecisionComparison;
  /** Studio never assigns the worker — Care domain remains SoT. */
  executionNote: string;
};

/**
 * First vertical slice: worker replacement after a Care cancellation.
 * Options are presented without default selection or auto-execution.
 */
export function buildWorkerReplacementPilot(input: {
  caseId: string;
  participantId: string;
  tenantId: string;
  careBookingId: string;
  cancelledWorkerId: string;
  initiatingActorId: string;
  nowIso: string;
  hardRequirements?: string[];
}): WorkerReplacementPilot {
  assertDecisionStudioEnabled();

  let decisionCase = createDecisionCase({
    id: input.caseId,
    participantId: input.participantId,
    tenantId: input.tenantId,
    decisionType: "worker_replacement",
    initiatingActorId: input.initiatingActorId,
    initiatingActorRole: "system",
    reason: "Care booking cancelled — participant chooses replacement pathway",
    humanOwnerId: null,
    sourceRefs: [
      { domain: "care", recordId: input.careBookingId },
      { domain: "worker", recordId: input.cancelledWorkerId },
    ],
    nowIso: input.nowIso,
    reversibleHours: 24,
  });

  decisionCase = transitionDecisionCase(
    decisionCase,
    "information_gathering",
    input.nowIso
  );
  decisionCase = transitionDecisionCase(
    decisionCase,
    "participant_review",
    input.nowIso
  );
  decisionCase = transitionDecisionCase(
    decisionCase,
    "ready_for_decision",
    input.nowIso
  );

  const hardRequirements = input.hardRequirements ?? [
    "Communication Passport acknowledgement",
    "step-free access support",
  ];

  const options = sortOptionsNeutrally([
    createDecisionOption({
      id: `${input.caseId}-opt-same-org`,
      decisionCaseId: decisionCase.id,
      label: "Replacement worker from same provider",
      sortIndex: 0,
      responsibleOrganisationId: "org-provider-a",
      timingEffect: "Search begins within the agreed recovery window",
      accessEffect: "step-free access support",
      communicationEffect: "Communication Passport acknowledgement",
      serviceEffect: "Same service type; new worker identity",
      evidenceRefs: [`care:${input.careBookingId}:cancellation`],
      unknowns: ["Named worker not yet confirmed"],
      conflicts: [],
      commercialInterest: null,
      recommendationSource: "none",
    }),
    createDecisionOption({
      id: `${input.caseId}-opt-reschedule`,
      decisionCaseId: decisionCase.id,
      label: "Reschedule with preferred worker when available",
      sortIndex: 1,
      timingEffect: "Later date; return journey can be re-planned",
      accessEffect: "step-free access support",
      communicationEffect: "Communication Passport acknowledgement",
      serviceEffect: "Deferred delivery; participant keeps preferred worker",
      evidenceRefs: [`care:${input.careBookingId}:preferred_worker`],
      unknowns: ["Preferred worker next availability"],
      conflicts: [],
      commercialInterest: null,
      recommendationSource: "participant_criteria",
    }),
    createDecisionOption({
      id: `${input.caseId}-opt-pause`,
      decisionCaseId: decisionCase.id,
      label: "Pause support and request human navigator",
      sortIndex: 2,
      timingEffect: "No immediate replacement",
      serviceEffect: "Human assistance pathway without AI requirement",
      evidenceRefs: [],
      unknowns: ["Navigator response time"],
      conflicts: [],
      commercialInterest: null,
      recommendationSource: "none",
    }),
  ]);

  // Commercial option last by sortIndex — never ranked first by payment.
  const withCommercialDisclosure = sortOptionsNeutrally([
    ...options,
    createDecisionOption({
      id: `${input.caseId}-opt-partner`,
      decisionCaseId: decisionCase.id,
      label: "Partner agency offer (commercial interest disclosed)",
      sortIndex: 3,
      responsibleOrganisationId: "org-partner-paid",
      timingEffect: "Same-day candidate",
      accessEffect: "access effects not yet confirmed",
      communicationEffect: "Passport acknowledgement not confirmed",
      serviceEffect: "Alternate provider",
      evidenceRefs: [],
      unknowns: ["Hard requirements not confirmed"],
      conflicts: ["Hard requirements not confirmed for partner offer"],
      commercialInterest: "partner_placement_fee",
      recommendationSource: "provider",
    }),
  ]);

  const comparison = buildDecisionComparison({
    decisionCaseId: decisionCase.id,
    options: withCommercialDisclosure,
    hardRequirements,
    preferences: ["familiar worker when possible", "plain language updates"],
  });

  return {
    decisionCase,
    options: withCommercialDisclosure,
    comparison,
    executionNote:
      "Participant selection produces a DecisionReceipt only. Care assignment remains in the Care domain after confirmation.",
  };
}

/**
 * Draft explanation text — only when AI explanations flag is on.
 * Deterministic template; does not call an LLM in this wave.
 */
export function draftDecisionExplanation(input: {
  comparison: DecisionComparison;
  optionLabels: string[];
}): string | null {
  if (!decisionStudioConfig.aiExplanationsEnabled) {
    return null;
  }
  return [
    "Here is a plain comparison of the options you can choose.",
    `Options shown: ${input.optionLabels.join("; ")}.`,
    `Hard requirements still needing confirmation: ${
      input.comparison.hardRequirementsNotConfirmed.join(", ") || "none"
    }.`,
    "No option is selected for you. You can ask a human at any time.",
  ].join(" ");
}
