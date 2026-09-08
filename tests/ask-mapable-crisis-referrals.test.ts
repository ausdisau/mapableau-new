import { describe, expect, it } from "vitest";

import {
  NATIONAL_CRISIS_REFERRALS,
  STATE_MENTAL_HEALTH_TRIAGE,
  crisisReferralsForJurisdiction,
  planCrisisReferral,
} from "@/lib/ask-mapable";

describe("Australian crisis referrals", () => {
  it("keeps emergency, national crisis and accessible relay pathways available", () => {
    expect(NATIONAL_CRISIS_REFERRALS.some((item) => item.id === "triple-zero")).toBe(true);
    expect(NATIONAL_CRISIS_REFERRALS.some((item) => item.id === "lifeline")).toBe(true);
    expect(
      NATIONAL_CRISIS_REFERRALS.some(
        (item) => item.id === "suicide-callback-service",
      ),
    ).toBe(true);
    expect(NATIONAL_CRISIS_REFERRALS.some((item) => item.id === "nrs")).toBe(true);
  });

  it("has a state or territory clinical/crisis pathway for every jurisdiction", () => {
    const jurisdictions = new Set(
      STATE_MENTAL_HEALTH_TRIAGE.map((item) => item.jurisdiction),
    );

    expect(jurisdictions).toEqual(
      new Set(["ACT", "NSW", "NT", "QLD", "SA", "TAS", "VIC", "WA"]),
    );
  });

  it("adds the participant jurisdiction without removing national choices", () => {
    const nsw = crisisReferralsForJurisdiction("NSW");

    expect(nsw.some((item) => item.id === "lifeline")).toBe(true);
    expect(nsw.some((item) => item.id === "nsw-mental-health-line")).toBe(true);
    expect(nsw.some((item) => item.jurisdiction === "VIC")).toBe(false);
  });

  it("never treats presenting a pathway as confirmation that a referral was accepted", () => {
    const lifeline = NATIONAL_CRISIS_REFERRALS.find(
      (item) => item.id === "lifeline",
    );
    expect(lifeline).toBeTruthy();

    const plan = planCrisisReferral(lifeline!);
    expect(plan.consentRequiredBeforeSharing).toBe(true);
    expect(plan.externalAcceptanceConfirmed).toBe(false);
  });
});
