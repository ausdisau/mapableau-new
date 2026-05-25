import { describe, expect, it } from "vitest";

import { isSafeguardingTicket } from "@/lib/support/ticket-service";

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
});
