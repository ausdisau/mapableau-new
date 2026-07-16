import { describe, expect, it } from "vitest";

import {
  validateDonationAmountCents,
} from "@/lib/donations/donation-checkout-service";
import { donationConfig } from "@/lib/donations/donation-config";
import { donationCheckoutMetadata } from "@/lib/stripe/metadata";

describe("donation checkout", () => {
  it("validates donation amounts in AUD cents", () => {
    expect(validateDonationAmountCents(2500)).toBeNull();
    expect(validateDonationAmountCents(499)).toMatch(/Minimum donation/i);
    expect(validateDonationAmountCents(0)).toMatch(/valid donation amount/i);
  });

  it("uses stable Stripe metadata for donations", () => {
    expect(donationCheckoutMetadata({ amountCents: 5000 })).toEqual({
      payment_purpose: "donation",
      amount_cents: "5000",
      mapable_donation: "true",
    });
  });

  it("points PayPal fallback at configured URL", () => {
    expect(donationConfig.paypalUrl).toContain("paypal.me");
  });
});
