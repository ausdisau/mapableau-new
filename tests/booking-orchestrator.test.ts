import { describe, expect, it } from "vitest";

import { canTransitionBookingStatus } from "@/lib/domain/booking-status";

describe("booking orchestration rules", () => {
  it("provider accept path uses accepted status", () => {
    expect(
      canTransitionBookingStatus("provider_review", "accepted")
    ).toBe(true);
    expect(
      canTransitionBookingStatus("awaiting_provider_acceptance", "accepted")
    ).toBe(true);
  });

  it("service completion leads to invoicing eligibility", () => {
    expect(canTransitionBookingStatus("in_progress", "completed")).toBe(true);
    expect(canTransitionBookingStatus("completed", "invoiced")).toBe(true);
  });
});
