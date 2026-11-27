import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  findUniqueBilling,
  upsertBilling,
  updateBilling,
  findUniqueLegacy,
  upsertLegacy,
  updateLegacy,
} = vi.hoisted(() => ({
  findUniqueBilling: vi.fn(),
  upsertBilling: vi.fn(),
  updateBilling: vi.fn(),
  findUniqueLegacy: vi.fn(),
  upsertLegacy: vi.fn(),
  updateLegacy: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    billingStripeWebhookEvent: {
      findUnique: findUniqueBilling,
      upsert: upsertBilling,
      update: updateBilling,
    },
    stripeWebhookEvent: {
      findUnique: findUniqueLegacy,
      upsert: upsertLegacy,
      update: updateLegacy,
    },
  },
}));

vi.mock("@/lib/payouts/config", () => ({
  paymentsMode: vi.fn(() => "test"),
}));

vi.mock("@/lib/ads/billing/stripe-webhook", () => ({
  isAdsWalletTopUpEvent: vi.fn(() => false),
  handleAdsStripeEvent: vi.fn(async () => undefined),
}));

vi.mock("@/lib/billing/core/webhook-handler", async () => {
  const store = await import("@/lib/billing/core/webhook-event-store");
  const livemode = await import("@/lib/billing/core/webhook-livemode");
  return {
    ...store,
    ...livemode,
    handleStripeBillingEvent: vi.fn(),
  };
});

vi.mock("@/lib/stripe/legacy-webhooks", async () => {
  const actual = await vi.importActual<
    typeof import("@/lib/stripe/legacy-webhooks")
  >("@/lib/stripe/legacy-webhooks");
  return {
    ...actual,
    handleLegacyStripeEvent: vi.fn(),
  };
});

import { handleStripeBillingEvent } from "@/lib/billing/core/webhook-handler";
import {
  markWebhookFailed,
  markWebhookProcessed,
  storeWebhookEventIdempotent,
} from "@/lib/billing/core/webhook-event-store";
import {
  assertLivemodeMatches,
  StripeLivemodeMismatchError,
} from "@/lib/billing/core/webhook-livemode";
import { paymentsMode } from "@/lib/payouts/config";
import { handleLegacyStripeEvent } from "@/lib/stripe/legacy-webhooks";
import { dispatchStripeWebhook } from "@/lib/stripe/webhooks";
import type Stripe from "stripe";

function makeEvent(
  overrides: Partial<Stripe.Event> & { id?: string; type?: string } = {},
): Stripe.Event {
  return {
    id: overrides.id ?? "evt_test_1",
    object: "event",
    api_version: "2026-05-27.dahlia",
    created: Math.floor(Date.now() / 1000),
    data: {
      object: {
        id: "cs_test_1",
        object: "checkout.session",
        metadata: { invoiceId: "inv_1" },
      } as Stripe.Checkout.Session,
    },
    livemode: overrides.livemode ?? false,
    pending_webhooks: 0,
    request: null,
    type: (overrides.type ?? "checkout.session.completed") as Stripe.Event.Type,
    ...overrides,
  } as Stripe.Event;
}

describe("assertLivemodeMatches", () => {
  beforeEach(() => {
    vi.mocked(paymentsMode).mockReturnValue("test");
  });

  it("allows test mode events when MAPABLE_PAYMENTS_MODE=test", () => {
    expect(() => assertLivemodeMatches(makeEvent({ livemode: false }))).not.toThrow();
  });

  it("rejects live events when env is test", () => {
    expect(() => assertLivemodeMatches(makeEvent({ livemode: true }))).toThrow(
      StripeLivemodeMismatchError,
    );
  });

  it("rejects test events when env is live", () => {
    vi.mocked(paymentsMode).mockReturnValue("live");
    expect(() => assertLivemodeMatches(makeEvent({ livemode: false }))).toThrow(
      StripeLivemodeMismatchError,
    );
  });
});

describe("storeWebhookEventIdempotent claim states", () => {
  beforeEach(() => {
    findUniqueBilling.mockReset();
    upsertBilling.mockReset();
    updateBilling.mockReset();
  });

  it("returns duplicate for already processed events", async () => {
    findUniqueBilling.mockResolvedValue({
      id: "row_1",
      processed: true,
      processingStatus: "processed",
    });
    const result = await storeWebhookEventIdempotent("evt_1", "checkout.session.completed", {});
    expect(result.duplicate).toBe(true);
    expect(upsertBilling).not.toHaveBeenCalled();
  });

  it("reclaims failed events for retry", async () => {
    findUniqueBilling.mockResolvedValue({
      id: "row_1",
      processed: false,
      processingStatus: "failed",
      claimExpiresAt: null,
    });
    upsertBilling.mockResolvedValue({
      id: "row_1",
      processingStatus: "processing",
    });
    const result = await storeWebhookEventIdempotent("evt_1", "checkout.session.completed", {});
    expect(result.duplicate).toBe(false);
    expect(upsertBilling).toHaveBeenCalled();
  });
});

describe("dispatchStripeWebhook failure safety", () => {
  beforeEach(() => {
    findUniqueBilling.mockReset();
    upsertBilling.mockReset();
    updateBilling.mockReset();
    findUniqueLegacy.mockReset();
    upsertLegacy.mockReset();
    updateLegacy.mockReset();
    vi.mocked(handleStripeBillingEvent).mockReset();
    vi.mocked(handleLegacyStripeEvent).mockReset();
    vi.mocked(paymentsMode).mockReturnValue("test");

    findUniqueBilling.mockResolvedValue(null);
    upsertBilling.mockResolvedValue({
      id: "billing_row",
      processingStatus: "processing",
    });
    updateBilling.mockResolvedValue({});
    findUniqueLegacy.mockResolvedValue(null);
    upsertLegacy.mockResolvedValue({
      processingStatus: "processing",
    });
    updateLegacy.mockResolvedValue({});
  });

  it("does not mark processed when billing handler throws", async () => {
    vi.mocked(handleStripeBillingEvent).mockRejectedValue(new Error("boom"));

    const result = await dispatchStripeWebhook(makeEvent());

    expect(result.billing.failed).toBe(true);
    expect(result.billing.processed).toBe(false);
    expect(result.hasFailure).toBe(true);
    expect(updateBilling).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          processingStatus: "failed",
          processed: false,
        }),
      }),
    );
    const processedCalls = updateBilling.mock.calls.filter(
      (c) => c[0]?.data?.processingStatus === "processed",
    );
    expect(processedCalls).toHaveLength(0);
  });

  it("quarantines livemode mismatch and does not mark processed", async () => {
    vi.mocked(handleStripeBillingEvent).mockImplementation(async (event) => {
      assertLivemodeMatches(event);
    });

    const result = await dispatchStripeWebhook(makeEvent({ livemode: true }));

    expect(result.billing.quarantined).toBe(true);
    expect(result.billing.processed).toBe(false);
    expect(result.hasFailure).toBe(true);
    expect(updateBilling).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          processingStatus: "quarantined",
          processed: false,
        }),
      }),
    );
  });

  it("marks processed only after successful handler", async () => {
    vi.mocked(handleStripeBillingEvent).mockResolvedValue(undefined);

    const result = await dispatchStripeWebhook(makeEvent());

    expect(result.billing.processed).toBe(true);
    expect(result.hasFailure).toBe(false);
    expect(updateBilling).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          processingStatus: "processed",
          processed: true,
        }),
      }),
    );
  });

  it("markWebhookFailed leaves processed=false for retry", async () => {
    await markWebhookFailed("row_x", new Error("retry me"));
    expect(updateBilling).toHaveBeenCalledWith({
      where: { id: "row_x" },
      data: expect.objectContaining({
        processed: false,
        processingStatus: "failed",
        lastError: "retry me",
      }),
    });
  });

  it("markWebhookProcessed sets terminal processed state", async () => {
    await markWebhookProcessed("row_y");
    expect(updateBilling).toHaveBeenCalledWith({
      where: { id: "row_y" },
      data: expect.objectContaining({
        processed: true,
        processingStatus: "processed",
      }),
    });
  });
});
