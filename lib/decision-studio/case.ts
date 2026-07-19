import { decisionStudioConfig } from "@/lib/config/decision-studio";

import { assertDecisionTransition } from "./state-machine";
import type {
  DecisionCase,
  DecisionOption,
  DecisionReceipt,
  DecisionState,
  DecisionSupportSession,
  DecisionType,
} from "./types";

export class DecisionStudioError extends Error {
  constructor(
    message: string,
    readonly statusCode = 400
  ) {
    super(message);
    this.name = "DecisionStudioError";
  }
}

export function assertDecisionStudioEnabled(): void {
  if (!decisionStudioConfig.enabled) {
    throw new DecisionStudioError(
      "MAPABLE_DECISION_STUDIO_ENABLED is false",
      503
    );
  }
}

export function createDecisionCase(input: {
  id: string;
  participantId: string;
  tenantId: string;
  decisionType: DecisionType;
  initiatingActorId: string;
  initiatingActorRole: DecisionCase["initiatingActorRole"];
  reason: string;
  deadlineIso?: string | null;
  humanOwnerId?: string | null;
  sourceRefs?: DecisionCase["sourceRefs"];
  nowIso: string;
  reversibleHours?: number;
}): DecisionCase {
  assertDecisionStudioEnabled();
  const reversibleUntilIso =
    decisionStudioConfig.reversibleDecisionsEnabled &&
    input.reversibleHours != null
      ? new Date(
          Date.parse(input.nowIso) + input.reversibleHours * 3600_000
        ).toISOString()
      : null;

  return {
    id: input.id,
    participantId: input.participantId,
    tenantId: input.tenantId,
    decisionType: input.decisionType,
    initiatingActorId: input.initiatingActorId,
    initiatingActorRole: input.initiatingActorRole,
    reason: input.reason,
    deadlineIso: input.deadlineIso ?? null,
    state: "draft",
    reversibleUntilIso,
    humanOwnerId: input.humanOwnerId ?? null,
    sourceRefs: input.sourceRefs ?? [],
    createdAtIso: input.nowIso,
    updatedAtIso: input.nowIso,
  };
}

export function transitionDecisionCase(
  decisionCase: DecisionCase,
  to: DecisionState,
  nowIso: string
): DecisionCase {
  assertDecisionStudioEnabled();
  assertDecisionTransition(decisionCase.state, to);
  return { ...decisionCase, state: to, updatedAtIso: nowIso };
}

export function createDecisionOption(input: {
  id: string;
  decisionCaseId: string;
  label: string;
  sortIndex: number;
  responsibleOrganisationId?: string | null;
  priceOrFinancialEffect?: string | null;
  timingEffect?: string | null;
  accessEffect?: string | null;
  communicationEffect?: string | null;
  serviceEffect?: string | null;
  transportEffect?: string | null;
  equipmentEffect?: string | null;
  evidenceRefs?: string[];
  unknowns?: string[];
  conflicts?: string[];
  commercialInterest?: string | null;
  recommendationSource?: DecisionOption["recommendationSource"];
}): DecisionOption {
  return {
    id: input.id,
    decisionCaseId: input.decisionCaseId,
    label: input.label,
    responsibleOrganisationId: input.responsibleOrganisationId ?? null,
    priceOrFinancialEffect: input.priceOrFinancialEffect ?? null,
    timingEffect: input.timingEffect ?? null,
    accessEffect: input.accessEffect ?? null,
    communicationEffect: input.communicationEffect ?? null,
    serviceEffect: input.serviceEffect ?? null,
    transportEffect: input.transportEffect ?? null,
    equipmentEffect: input.equipmentEffect ?? null,
    evidenceRefs: input.evidenceRefs ?? [],
    unknowns: input.unknowns ?? [],
    conflicts: input.conflicts ?? [],
    commercialInterest: input.commercialInterest ?? null,
    recommendationSource: input.recommendationSource ?? "none",
    isDefault: false,
    sortIndex: input.sortIndex,
  };
}

/**
 * Participant selects an option. Studio never executes Care/Transport writes.
 */
export function recordParticipantSelection(input: {
  decisionCase: DecisionCase;
  options: DecisionOption[];
  selectedOptionId: string;
  requireConfirmation: boolean;
  nowIso: string;
  coolingOffHours?: number;
}): { decisionCase: DecisionCase; receipt: DecisionReceipt } {
  assertDecisionStudioEnabled();
  let current = input.decisionCase;
  if (current.state === "ready_for_decision") {
    current = transitionDecisionCase(
      current,
      "participant_selected",
      input.nowIso
    );
  }
  if (current.state !== "participant_selected") {
    throw new DecisionStudioError(
      `Cannot select from state ${current.state}`,
      409
    );
  }
  const selected = input.options.find((o) => o.id === input.selectedOptionId);
  if (!selected) {
    throw new DecisionStudioError("Selected option not shown", 400);
  }
  if (selected.isDefault !== false) {
    throw new DecisionStudioError("Default consequential selection forbidden");
  }

  let next = current;
  if (input.requireConfirmation) {
    next = transitionDecisionCase(
      current,
      "confirmation_required",
      input.nowIso
    );
  }

  const coolingOffUntilIso =
    decisionStudioConfig.reversibleDecisionsEnabled &&
    input.coolingOffHours != null
      ? new Date(
          Date.parse(input.nowIso) + input.coolingOffHours * 3600_000
        ).toISOString()
      : null;

  const receipt: DecisionReceipt = {
    id: `receipt-${current.id}`,
    decisionCaseId: current.id,
    optionIdsShown: input.options.map((o) => o.id),
    evidenceVersions: input.options.flatMap((o) => o.evidenceRefs),
    conflictsDisclosed: [
      ...new Set(input.options.flatMap((o) => o.conflicts)),
    ],
    supporterInvolved: false,
    participantSelectedOptionId: selected.id,
    confirmationAtIso: input.requireConfirmation ? null : input.nowIso,
    coolingOffUntilIso,
    reversedAtIso: null,
    finalAction: input.requireConfirmation ? "none" : "confirmed",
    correctionHistory: [],
    executionDelegated: true,
  };

  if (!input.requireConfirmation) {
    next = transitionDecisionCase(next, "confirmed", input.nowIso);
  }

  return { decisionCase: next, receipt };
}

export function reverseDecision(input: {
  decisionCase: DecisionCase;
  receipt: DecisionReceipt;
  nowIso: string;
}): { decisionCase: DecisionCase; receipt: DecisionReceipt } {
  assertDecisionStudioEnabled();
  if (!decisionStudioConfig.reversibleDecisionsEnabled) {
    throw new DecisionStudioError(
      "MAPABLE_REVERSIBLE_DECISIONS_ENABLED is false",
      503
    );
  }
  if (input.decisionCase.state !== "confirmed") {
    throw new DecisionStudioError("Only confirmed decisions can reverse", 409);
  }
  if (
    input.decisionCase.reversibleUntilIso &&
    input.nowIso > input.decisionCase.reversibleUntilIso
  ) {
    throw new DecisionStudioError("Reversal window expired", 409);
  }
  const decisionCase = transitionDecisionCase(
    input.decisionCase,
    "reversed",
    input.nowIso
  );
  return {
    decisionCase,
    receipt: {
      ...input.receipt,
      reversedAtIso: input.nowIso,
      finalAction: "reversed",
    },
  };
}

export function createSupportSession(input: {
  id: string;
  decisionCaseId: string;
  participantId: string;
  supporterId: string;
  supporterAuthority: DecisionSupportSession["supporterAuthority"];
  expiresAtIso: string;
  privateParticipantNotes?: string | null;
  sharedNotes?: string | null;
}): DecisionSupportSession {
  assertDecisionStudioEnabled();
  if (input.supporterAuthority === "none") {
    throw new DecisionStudioError(
      "Supporter session requires explicit authority beyond relationship"
    );
  }
  return {
    id: input.id,
    decisionCaseId: input.decisionCaseId,
    participantId: input.participantId,
    supporterId: input.supporterId,
    supporterAuthority: input.supporterAuthority,
    privateParticipantNotes: input.privateParticipantNotes ?? null,
    sharedNotes: input.sharedNotes ?? null,
    questions: [],
    expiresAtIso: input.expiresAtIso,
  };
}

/** Relationship alone never authorises a decision. */
export function assertSupporterCannotDecideAlone(input: {
  session: DecisionSupportSession | null;
  actorId: string;
  participantId: string;
}): void {
  if (input.actorId === input.participantId) return;
  if (!input.session) {
    throw new DecisionStudioError(
      "Supporter has no session — relationship is not authority",
      403
    );
  }
  if (input.session.supporterAuthority === "assist_only") {
    throw new DecisionStudioError(
      "Supporter assist_only cannot select a decision option",
      403
    );
  }
  if (input.session.supporterId !== input.actorId) {
    throw new DecisionStudioError("Supporter identity mismatch", 403);
  }
}
