import { describe, expect, it } from "vitest";

import {
  evaluateCreativeForReview,
  SelfApprovalError,
} from "@/lib/ads/manager/review";

describe("creative review helpers", () => {
  it("flags regulated claim language", () => {
    const result = evaluateCreativeForReview({
      headline: "NDIS accredited provider",
      body: "Fully accessible guaranteed outcomes",
      altText: "Clinic entrance",
    });
    expect(result.requiresHumanReview).toBe(true);
    expect(result.claimFlags.length).toBeGreaterThan(0);
  });

  it("exposes self-approval error code", () => {
    const err = new SelfApprovalError();
    expect(err.code).toBe("REVIEWER_SELF_APPROVAL");
  });
});
