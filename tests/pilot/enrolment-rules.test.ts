import { describe, expect, it } from "vitest";

import {
  evaluateParticipantEligibility,
  ordinaryConsentSatisfiesPilotConsent,
} from "@/lib/pilot/enrolment/participant-eligibility";

describe("pilot enrolment rules", () => {
  it("ordinary consent is never pilot consent", () => {
    expect(ordinaryConsentSatisfiesPilotConsent(true)).toBe(false);
    expect(ordinaryConsentSatisfiesPilotConsent(false)).toBe(false);
  });

  it("requires explicit pilot consent to enrol", () => {
    const result = evaluateParticipantEligibility({
      participantActive: true,
      hasOrdinaryConsent: true,
      hasPilotConsent: false,
      alreadyEnrolled: false,
      pilotAcceptingEnrolments: true,
      maxActiveParticipants: 10,
      currentEnrolledCount: 0,
    });
    expect(result.eligible).toBe(false);
    expect(result.reasons).toContain("PILOT_CONSENT_REQUIRED");
    expect(result.reasons).toContain("ORDINARY_CONSENT_NOT_PILOT_CONSENT");
  });

  it("empty max participants denies", () => {
    const result = evaluateParticipantEligibility({
      participantActive: true,
      hasOrdinaryConsent: false,
      hasPilotConsent: true,
      alreadyEnrolled: false,
      pilotAcceptingEnrolments: true,
      maxActiveParticipants: 0,
      currentEnrolledCount: 0,
    });
    expect(result.eligible).toBe(false);
    expect(result.reasons).toContain("MAX_PARTICIPANTS_ZERO_DENY");
  });
});
