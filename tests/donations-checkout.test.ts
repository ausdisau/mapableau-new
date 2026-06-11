import { describe, expect, it } from "vitest";

import { donationCheckoutMetadata, isDonationStripeMetadata } from "@/lib/donations/metadata";
import { donationCheckoutSchema } from "@/lib/donations/schemas";

describe("donation checkout schema", () => {
  it("accepts valid preset amounts", () => {
    expect(
      donationCheckoutSchema.safeParse({ amountCents: 5000 }).success
    ).toBe(true);
    expect(
      donationCheckoutSchema.safeParse({
        amountCents: 25000,
        donorName: "Alex",
        message: "Keep up the great work",
        donorEmail: "alex@example.com",
      }).success
    ).toBe(true);
  });

  it("rejects amounts below minimum", () => {
    const parsed = donationCheckoutSchema.safeParse({ amountCents: 100 });
    expect(parsed.success).toBe(false);
  });

  it("rejects amounts above maximum", () => {
    const parsed = donationCheckoutSchema.safeParse({ amountCents: 2_000_000 });
    expect(parsed.success).toBe(false);
  });

  it("rejects invalid email", () => {
    const parsed = donationCheckoutSchema.safeParse({
      amountCents: 5000,
      donorEmail: "not-an-email",
    });
    expect(parsed.success).toBe(false);
  });
});

describe("donation metadata", () => {
  it("builds checkout metadata with donation id and purpose", () => {
    const meta = donationCheckoutMetadata({ donationId: "don_1", userId: "user_1" });
    expect(meta.donationId).toBe("don_1");
    expect(meta.purpose).toBe("donation");
    expect(meta.userId).toBe("user_1");
  });

  it("detects donation stripe metadata", () => {
    expect(isDonationStripeMetadata({ donationId: "don_1" })).toBe(true);
    expect(isDonationStripeMetadata({ purpose: "donation" })).toBe(true);
    expect(isDonationStripeMetadata({ invoiceId: "inv_1" })).toBe(false);
  });
});
