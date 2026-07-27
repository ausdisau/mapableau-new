import { afterEach, describe, expect, it, vi } from "vitest";

import {
  isDonationMetadata,
  isDonationStripeEnabled,
} from "@/lib/donations/config";
import {
  buildDonationCheckoutMetadata,
  createDonationCheckoutSession,
  validateDonationAmountCents,
} from "@/lib/donations/stripe-checkout";
import { dispatchStripeWebhook } from "@/lib/stripe/webhooks";

vi.mock("@/lib/stripe/checkout", () => ({
  createStripePaymentCheckoutSession: vi.fn(async () => ({
    id: "cs_test_donation",
    url: "https://checkout.stripe.com/c/pay/cs_test_donation",
  })),
}));

vi.mock("@/lib/billing/core/webhook-handler", () => ({
  storeWebhookEventIdempotent: vi.fn(),
  markWebhookProcessed: vi.fn(),
  handleStripeBillingEvent: vi.fn(),
}));

vi.mock("@/lib/stripe/legacy-webhooks", () => ({
  storeLegacyWebhookEventIdempotent: vi.fn(),
  markLegacyWebhookProcessed: vi.fn(),
  handleLegacyStripeEvent: vi.fn(),
}));

describe("donation amount validation", () => {
  it("accepts amounts within AUD bounds", () => {
    expect(validateDonationAmountCents(500)).toBeNull();
    expect(validateDonationAmountCents(2500)).toBeNull();
    expect(validateDonationAmountCents(5_000_000)).toBeNull();
  });

  it("rejects amounts below minimum or above maximum", () => {
    expect(validateDonationAmountCents(499)).toMatch(/Minimum/);
    expect(validateDonationAmountCents(5_000_001)).toMatch(/Maximum/);
    expect(validateDonationAmountCents(12.5)).toMatch(/whole/i);
  });
});

describe("donation feature flag", () => {
  it("requires MAPABLE_DONATIONS_STRIPE_ENABLED and STRIPE_SECRET_KEY", () => {
    expect(
      isDonationStripeEnabled({
        MAPABLE_DONATIONS_STRIPE_ENABLED: "true",
        STRIPE_SECRET_KEY: "sk_test_x",
      } as NodeJS.ProcessEnv),
    ).toBe(true);
    expect(
      isDonationStripeEnabled({
        MAPABLE_DONATIONS_STRIPE_ENABLED: "false",
        STRIPE_SECRET_KEY: "sk_test_x",
      } as NodeJS.ProcessEnv),
    ).toBe(false);
    expect(
      isDonationStripeEnabled({
        MAPABLE_DONATIONS_STRIPE_ENABLED: "true",
      } as NodeJS.ProcessEnv),
    ).toBe(false);
  });
});

describe("donation checkout metadata", () => {
  it("tags sessions for webhook isolation", () => {
    const meta = buildDonationCheckoutMetadata({ amountCents: 5000 });
    expect(isDonationMetadata(meta)).toBe(true);
    expect(meta.purpose).toBe("donation");
    expect(meta.mapableFlow).toBe("donation");
    expect(meta.amountCents).toBe("5000");
    expect(meta.legalEntity).toBe("Australian Disability Ltd");
  });
});

describe("createDonationCheckoutSession", () => {
  afterEach(() => {
    delete process.env.MAPABLE_DONATIONS_STRIPE_ENABLED;
    delete process.env.STRIPE_SECRET_KEY;
  });

  it("returns 503 when donations Stripe flag is off", async () => {
    process.env.MAPABLE_DONATIONS_STRIPE_ENABLED = "false";
    process.env.STRIPE_SECRET_KEY = "sk_test_x";
    const result = await createDonationCheckoutSession({ amountCents: 2500 });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.status).toBe(503);
    }
  });

  it("returns Checkout URL when enabled", async () => {
    process.env.MAPABLE_DONATIONS_STRIPE_ENABLED = "true";
    process.env.STRIPE_SECRET_KEY = "sk_test_x";
    const result = await createDonationCheckoutSession({ amountCents: 2500 });
    expect(result).toEqual({
      ok: true,
      url: "https://checkout.stripe.com/c/pay/cs_test_donation",
      sessionId: "cs_test_donation",
    });
  });
});

describe("donation webhook isolation", () => {
  it("acknowledges donation checkout.session.completed without billing", async () => {
    const { handleStripeBillingEvent } = await import(
      "@/lib/billing/core/webhook-handler"
    );
    const { handleLegacyStripeEvent } = await import(
      "@/lib/stripe/legacy-webhooks"
    );

    const event = {
      id: "evt_donation_1",
      type: "checkout.session.completed",
      data: {
        object: {
          id: "cs_donation",
          metadata: {
            purpose: "donation",
            mapableFlow: "donation",
            amountCents: "2500",
          },
        },
      },
    } as unknown as import("stripe").Event;

    const result = await dispatchStripeWebhook(event);
    expect(result.donation.acknowledged).toBe(true);
    expect(result.billing.processed).toBe(false);
    expect(result.legacy.processed).toBe(false);
    expect(handleStripeBillingEvent).not.toHaveBeenCalled();
    expect(handleLegacyStripeEvent).not.toHaveBeenCalled();
  });
});
