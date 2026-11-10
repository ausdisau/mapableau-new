import { describe, expect, it } from "vitest";

import {
  accessiMartReviewGateFromEnvironment,
  canAccessAccessiMartReview,
} from "@/lib/marketplace/accessimart-review-access";

describe("AccessiMart review access gate", () => {
  it("denies when flag is off", () => {
    const gate = accessiMartReviewGateFromEnvironment({
      MAPABLE_ACCESSIMART_REVIEW_ENABLED: "false",
      MAPABLE_ACCESSIMART_REVIEW_TESTER_IDS: "user-1",
    });
    expect(
      canAccessAccessiMartReview(
        { id: "user-1", primaryRole: "participant" },
        gate,
      ),
    ).toBe(false);
  });

  it("denies unauthenticated users when flag is on", () => {
    const gate = accessiMartReviewGateFromEnvironment({
      MAPABLE_ACCESSIMART_REVIEW_ENABLED: "true",
      MAPABLE_ACCESSIMART_REVIEW_TESTER_IDS: "user-1",
    });
    expect(canAccessAccessiMartReview(null, gate)).toBe(false);
  });

  it("denies non-allowlisted non-admin users", () => {
    const gate = accessiMartReviewGateFromEnvironment({
      MAPABLE_ACCESSIMART_REVIEW_ENABLED: "true",
      MAPABLE_ACCESSIMART_REVIEW_TESTER_IDS: "user-1",
    });
    expect(
      canAccessAccessiMartReview(
        { id: "user-2", primaryRole: "participant" },
        gate,
      ),
    ).toBe(false);
  });

  it("allows allowlisted testers and mapable_admin when flag is on", () => {
    const gate = accessiMartReviewGateFromEnvironment({
      MAPABLE_ACCESSIMART_REVIEW_ENABLED: "true",
      MAPABLE_ACCESSIMART_REVIEW_TESTER_IDS: "user-1, user-9",
    });
    expect(
      canAccessAccessiMartReview(
        { id: "user-1", primaryRole: "participant" },
        gate,
      ),
    ).toBe(true);
    expect(
      canAccessAccessiMartReview(
        { id: "anyone", primaryRole: "mapable_admin" },
        gate,
      ),
    ).toBe(true);
  });
});
