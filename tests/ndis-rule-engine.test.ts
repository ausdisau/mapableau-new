import { describe, expect, it } from "vitest";

import { evaluateNdisRules } from "@/lib/ndis-rule-engine/evaluate";
import { defaultNdisRules } from "@/lib/ndis-rule-engine/rules";

describe("evaluateNdisRules", () => {
  it("allows a simple allowed context", () => {
    const result = evaluateNdisRules(
      {
        serviceRequest: { serviceType: "community_access", fundingCategory: "transport" },
        participantConsent: { shareSensitiveAccessNeeds: true },
        providerVerification: { claimsNdisRegistration: false, verifiedNdisRegistration: false },
      },
      defaultNdisRules,
    );
    expect(result.outcome).toBe("allowed");
  });

  it("blocks when price exceeds limit", () => {
    const result = evaluateNdisRules(
      {
        serviceRequest: { serviceType: "personal_care", priceCents: 50_000 },
        priceLimitCents: 30_000,
      },
      defaultNdisRules,
    );
    expect(result.outcome).toBe("blocked");
  });

  it("flags wheelchair vehicle requirement", () => {
    const result = evaluateNdisRules(
      {
        serviceRequest: { serviceType: "transport", requiresWheelchairVehicle: true },
      },
      defaultNdisRules,
    );
    expect(result.outcome).toBe("reviewRequired");
    expect(result.flags.some((f) => f.code.includes("wav_required"))).toBe(true);
  });
});
