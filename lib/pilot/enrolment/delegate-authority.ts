export type DelegateAuthorityCheck = {
  allowed: boolean;
  reason: string | null;
};

/**
 * Delegate may act for pilot consent only when explicitly linked on enrolment.
 * No auto-enrolment via delegate.
 */
export function canDelegateProvidePilotConsent(input: {
  delegateUserId: string | null | undefined;
  actorUserId: string;
  enrolmentDelegateUserId: string | null | undefined;
}): DelegateAuthorityCheck {
  if (!input.delegateUserId && input.actorUserId) {
    // Participant acting for self
    return { allowed: true, reason: null };
  }
  if (
    input.enrolmentDelegateUserId &&
    input.actorUserId === input.enrolmentDelegateUserId
  ) {
    return { allowed: true, reason: null };
  }
  return { allowed: false, reason: "DELEGATE_NOT_AUTHORISED_FOR_PILOT_CONSENT" };
}
