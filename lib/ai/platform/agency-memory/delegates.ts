import type { ProposeMemoryInput } from "./schemas";

/**
 * Delegate authority rules for Agency Memory.
 * Family opinion ≠ participant preference by default.
 */

export type DelegateWriteAssessment = {
  allowed: boolean;
  mustProposeOnly: boolean;
  reason: string;
};

const DELEGATE_PROPOSAL_DOMAINS = new Set([
  "profile",
  "care",
  "transport",
  "communication",
  "access",
  "support",
]);

const DELEGATE_AUTHORISED_DOMAINS = new Set([
  "profile",
  "care",
  "transport",
  "communication",
]);

export function assessDelegateMemoryWrite(input: {
  actorId: string;
  participantId: string;
  delegate?: ProposeMemoryInput["delegate"];
  source: ProposeMemoryInput["source"];
}): DelegateWriteAssessment {
  if (input.actorId === input.participantId) {
    return {
      allowed: true,
      mustProposeOnly: false,
      reason: "Participant is the memory subject.",
    };
  }

  if (!input.delegate) {
    return {
      allowed: false,
      mustProposeOnly: true,
      reason: "Delegate metadata required when actor is not the participant.",
    };
  }

  if (input.delegate.delegateId !== input.actorId) {
    return {
      allowed: false,
      mustProposeOnly: true,
      reason: "Delegate identity does not match actor.",
    };
  }

  if (input.delegate.suppliedAs === "delegate_opinion") {
    return {
      allowed: DELEGATE_PROPOSAL_DOMAINS.has(input.delegate.authorityDomain),
      mustProposeOnly: true,
      reason:
        "Family or support opinion is stored as a proposal only — not a participant preference until confirmed.",
    };
  }

  if (
    input.delegate.suppliedAs === "delegate_authorised_write" &&
    DELEGATE_AUTHORISED_DOMAINS.has(input.delegate.authorityDomain)
  ) {
    return {
      allowed: true,
      mustProposeOnly: input.delegate.requiresParticipantConfirmation !== false,
      reason:
        "Authorised delegate may propose; participant confirmation required before personalisation use.",
    };
  }

  return {
    allowed: false,
    mustProposeOnly: true,
    reason: "Delegate authority domain does not permit this memory write.",
  };
}

export function assertDelegateMayNotExceedAuthority(
  assessment: DelegateWriteAssessment,
): void {
  if (!assessment.allowed) {
    throw new Error(
      `AGENCY_MEMORY_DELEGATE_EXCEEDS_AUTHORITY:${assessment.reason}`,
    );
  }
}
