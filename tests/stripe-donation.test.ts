import { describe, expect, it } from "vitest";

import {
  calculateDonationPlatformFeeCents,
  createDonationCheckoutSession,
  isDonationCheckoutConfigured,
  normalizeDonationAmountCents,
} from "@/lib/stripe/donation";

describe("Stripe donation checkout", () => {
  it("is not configured without connected account id", () => {
    expect(isDonationCheckoutConfigured()).toBe(false);
  });

  it("normalizes default amount within bounds", () => {
    expect(normalizeDonationAmountCents()).toBe(2500);
    expect(normalizeDonationAmountCents(1000)).toBe(1000);
    expect(normalizeDonationAmountCents(100)).toBeNull();
    expect(normalizeDonationAmountCents(1_000_000)).toBeNull();
  });

  it("calculates zero platform fee by default", () => {
    expect(calculateDonationPlatformFeeCents(10_000)).toBe(0);
  });

  it("returns not configured when Stripe Connect donation env is missing", async () => {
    const result = await createDonationCheckoutSession({});
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.configured).toBe(false);
    }
  });
});
