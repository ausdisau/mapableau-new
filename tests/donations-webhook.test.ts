import type Stripe from "stripe";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { isDonationStripeMetadata } from "@/lib/donations/metadata";
import { handleDonationStripeEvent } from "@/lib/donations/webhook-handler";
import { dispatchStripeWebhook } from "@/lib/stripe/webhooks";
import { prisma } from "@/lib/prisma";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    donation: {
      findFirst: vi.fn(),
      update: vi.fn(),
    },
  },
}));

vi.mock("@/lib/billing-core/webhook-handler", () => ({
  storeWebhookEventIdempotent: vi.fn(),
  handleStripeBillingEvent: vi.fn(),
  markWebhookProcessed: vi.fn(),
}));

vi.mock("@/lib/stripe/legacy-webhooks", () => ({
  storeLegacyWebhookEventIdempotent: vi.fn().mockResolvedValue({ duplicate: false }),
  handleLegacyStripeEvent: vi.fn(),
  markLegacyWebhookProcessed: vi.fn(),
}));

function donationSessionEvent(
  type: Stripe.Event.Type,
  overrides?: Partial<Stripe.Checkout.Session>
): Stripe.Event {
  return {
    id: "evt_donation_1",
    type,
    data: {
      object: {
        id: "cs_test_donation",
        metadata: { donationId: "don_1", purpose: "donation" },
        payment_intent: "pi_test_1",
        customer_details: { email: "donor@example.com" },
        ...overrides,
      },
    },
  } as Stripe.Event;
}

describe("donation webhook handler", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("marks donation paid on checkout.session.completed", async () => {
    vi.mocked(prisma.donation.findFirst).mockResolvedValue({
      id: "don_1",
      status: "pending",
      stripePaymentIntentId: null,
      donorEmail: null,
      paidAt: null,
    } as never);
    vi.mocked(prisma.donation.update).mockResolvedValue({} as never);

    await handleDonationStripeEvent(donationSessionEvent("checkout.session.completed"));

    expect(prisma.donation.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "don_1" },
        data: expect.objectContaining({
          status: "paid",
          stripeCheckoutSessionId: "cs_test_donation",
          stripePaymentIntentId: "pi_test_1",
          donorEmail: "donor@example.com",
        }),
      })
    );
  });

  it("marks donation failed on async payment failure", async () => {
    vi.mocked(prisma.donation.findFirst).mockResolvedValue({
      id: "don_1",
      status: "pending",
      stripePaymentIntentId: null,
      donorEmail: null,
      paidAt: null,
    } as never);
    vi.mocked(prisma.donation.update).mockResolvedValue({} as never);

    await handleDonationStripeEvent(
      donationSessionEvent("checkout.session.async_payment_failed")
    );

    expect(prisma.donation.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: "failed" }),
      })
    );
  });
});

describe("stripe webhook routing", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(prisma.donation.findFirst).mockResolvedValue(null);
  });

  it("routes donation checkout sessions to donation handler", async () => {
    const result = await dispatchStripeWebhook(
      donationSessionEvent("checkout.session.completed")
    );
    expect(result.donation.processed).toBe(true);
  });

  it("does not treat donation metadata as legacy invoice checkout", () => {
    expect(
      isDonationStripeMetadata({ donationId: "don_1", purpose: "donation" })
    ).toBe(true);
  });
});
