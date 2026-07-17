/**
 * Pure eligibility rules for ControlledPilot enrolment.
 * Ordinary platform consent is NOT pilot consent.
 */

export type EligibilityInput = {
  participantActive: boolean;
  hasOrdinaryConsent: boolean;
  hasPilotConsent: boolean;
  alreadyEnrolled: boolean;
  pilotAcceptingEnrolments: boolean;
  maxActiveParticipants: number;
  currentEnrolledCount: number;
};

export type EligibilityResult = {
  eligible: boolean;
  reasons: string[];
};

export function evaluateParticipantEligibility(
  input: EligibilityInput
): EligibilityResult {
  const reasons: string[] = [];
  if (!input.participantActive) reasons.push("PARTICIPANT_INACTIVE");
  if (!input.pilotAcceptingEnrolments) reasons.push("PILOT_NOT_ACCEPTING");
  if (input.alreadyEnrolled) reasons.push("ALREADY_ENROLLED");
  if (input.maxActiveParticipants <= 0) {
    reasons.push("MAX_PARTICIPANTS_ZERO_DENY");
  } else if (input.currentEnrolledCount >= input.maxActiveParticipants) {
    reasons.push("MAX_PARTICIPANTS_REACHED");
  }
  // Ordinary consent does not satisfy pilot consent — flagged separately.
  if (input.hasOrdinaryConsent && !input.hasPilotConsent) {
    reasons.push("ORDINARY_CONSENT_NOT_PILOT_CONSENT");
  }
  if (!input.hasPilotConsent) {
    reasons.push("PILOT_CONSENT_REQUIRED");
  }
  return { eligible: reasons.length === 0, reasons };
}

/** Pure: ordinary consent never equals pilot consent. */
export function ordinaryConsentSatisfiesPilotConsent(
  hasOrdinaryConsent: boolean
): boolean {
  void hasOrdinaryConsent;
  return false;
}
