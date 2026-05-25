import { describe, expect, it } from "vitest";

import { shouldRequireParticipantChoice } from "@/lib/service-recovery/service-recovery-service";
import { isSafeguardingTicket } from "@/lib/support/ticket-service";
import { isVerificationCurrent } from "@/lib/verification/verification-service";

describe("P1 shell + P2 support integration", () => {
  it("flags safeguarding tickets", () => {
    expect(
      isSafeguardingTicket({
        category: "safeguarding_concern",
        requiresIncidentReview: false,
      })
    ).toBe(true);
  });

  it("does not flag billing tickets as safeguarding by default", () => {
    expect(
      isSafeguardingTicket({
        category: "billing_question",
        requiresIncidentReview: false,
      })
    ).toBe(false);
  });

  it("requires participant choice for disruptive recovery triggers", () => {
    expect(shouldRequireParticipantChoice("provider_declined")).toBe(true);
    expect(shouldRequireParticipantChoice("participant_reported_issue")).toBe(
      false
    );
  });

  it("fails verification gates closed when records expire", () => {
    expect(
      isVerificationCurrent({
        status: "verified",
        expiryDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
      })
    ).toBe(true);
    expect(
      isVerificationCurrent({
        status: "verified",
        expiryDate: new Date(Date.now() - 24 * 60 * 60 * 1000),
      })
    ).toBe(false);
    expect(isVerificationCurrent({ status: "pending_review" })).toBe(false);
  });
});
