import { describe, expect, it } from "vitest";

import {
  MENTAL_HEALTH_STEP_DOWN_REFERRALS,
  specialisedSafeguardingReferrals,
} from "@/lib/ask-mapable/step-down-referrals";

describe("Australian non-crisis and safeguarding referrals", () => {
  it("labels Medicare Mental Health as non-crisis", () => {
    const service = MENTAL_HEALTH_STEP_DOWN_REFERRALS.find(
      (item) => item.id === "medicare-mental-health",
    );

    expect(service).toBeTruthy();
    expect(service?.isCrisisService).toBe(false);
    expect(service?.phone).toBe("1800 595 212");
  });

  it("keeps healthdirect available as clinical navigation rather than emergency dispatch", () => {
    const service = MENTAL_HEALTH_STEP_DOWN_REFERRALS.find(
      (item) => item.id === "healthdirect",
    );

    expect(service).toBeTruthy();
    expect(service?.isCrisisService).toBe(false);
    expect(service?.availability).toContain("24/7");
    expect(service?.phone).toBe("1800 022 222");
  });

  it("keeps family and sexual violence support in a specialised safeguarding group", () => {
    const services = specialisedSafeguardingReferrals();
    const respect = services.find((item) => item.id === "1800respect");

    expect(respect).toBeTruthy();
    expect(respect?.phone).toBe("1800 737 732");
    expect(respect?.text).toBe("0458 737 732");
    expect(respect?.category).toBe("violence_abuse_support");
  });

  it("does not represent any step-down pathway as external acceptance", () => {
    for (const service of MENTAL_HEALTH_STEP_DOWN_REFERRALS) {
      expect(service.externalAcceptanceConfirmed).toBe(false);
    }
  });
});
