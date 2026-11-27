import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const {
  markWebhookProcessed,
  markLegacyWebhookProcessed,
  storeWebhookEventIdempotent,
  storeLegacyWebhookEventIdempotent,
  handleStripeBillingEvent,
  handleLegacyStripeEvent,
  handleAdsStripeEvent,
  isAdsWalletTopUpEvent,
} = vi.hoisted(() => ({
  markWebhookProcessed: vi.fn(async () => undefined),
  markLegacyWebhookProcessed: vi.fn(async () => undefined),
  storeWebhookEventIdempotent: vi.fn(async () => ({
    duplicate: false,
    eventRowId: "row_1",
  })),
  storeLegacyWebhookEventIdempotent: vi.fn(async () => ({
    duplicate: false,
  })),
  handleStripeBillingEvent: vi.fn(async () => undefined),
  handleLegacyStripeEvent: vi.fn(async () => undefined),
  handleAdsStripeEvent: vi.fn(async () => undefined),
  isAdsWalletTopUpEvent: vi.fn(() => false),
}));

vi.mock("@/lib/billing/core/webhook-handler", () => ({
  handleStripeBillingEvent,
  markWebhookProcessed,
  storeWebhookEventIdempotent,
}));

vi.mock("@/lib/stripe/legacy-webhooks", () => ({
  handleLegacyStripeEvent,
  markLegacyWebhookProcessed,
  storeLegacyWebhookEventIdempotent,
}));

vi.mock("@/lib/ads/billing/stripe-webhook", () => ({
  handleAdsStripeEvent,
  isAdsWalletTopUpEvent,
}));

vi.mock("@/lib/stripe/config", () => ({
  isStripeSdkAvailable: () => true,
  stripeConfig: { webhookSecret: "whsec_test" },
}));

vi.mock("@/lib/stripe/client", () => ({
  getStripeClient: () => ({
    webhooks: { constructEvent: () => ({}) },
  }),
}));

vi.mock("@/lib/stripe/metadata", () => ({
  legacyInvoiceIdFromMetadata: (meta: Record<string, string> | null | undefined) =>
    meta?.legacyInvoiceId ?? null,
}));

import { dispatchStripeWebhook } from "@/lib/stripe/webhooks";

function billingEvent() {
  return {
    id: "evt_test_1",
    type: "checkout.session.completed",
    livemode: false,
    data: {
      object: {
        id: "cs_test",
        metadata: { invoiceId: "inv_1" },
      },
    },
  } as never;
}

beforeEach(() => {
  vi.clearAllMocks();
  isAdsWalletTopUpEvent.mockReturnValue(false);
  storeWebhookEventIdempotent.mockResolvedValue({
    duplicate: false,
    eventRowId: "row_1",
  });
  storeLegacyWebhookEventIdempotent.mockResolvedValue({ duplicate: false });
});

afterEach(() => {
  vi.clearAllMocks();
});

describe("dispatchStripeWebhook fail-closed", () => {
  it("marks billing processed only after successful handler", async () => {
    handleStripeBillingEvent.mockResolvedValueOnce(undefined);
    const result = await dispatchStripeWebhook(billingEvent());
    expect(handleStripeBillingEvent).toHaveBeenCalled();
    expect(markWebhookProcessed).toHaveBeenCalledWith("row_1");
    expect(result.billing.processed).toBe(true);
    expect(result.billing.failed).toBe(false);
    expect(result.anyFailed).toBe(false);
  });

  it("does not mark processed when billing handler throws", async () => {
    handleStripeBillingEvent.mockRejectedValueOnce(new Error("boom"));
    const result = await dispatchStripeWebhook(billingEvent());
    expect(markWebhookProcessed).not.toHaveBeenCalled();
    expect(result.billing.processed).toBe(false);
    expect(result.billing.failed).toBe(true);
    expect(result.anyFailed).toBe(true);
  });

  it("does not mark ads processed when ads handler throws", async () => {
    isAdsWalletTopUpEvent.mockReturnValue(true);
    handleAdsStripeEvent.mockRejectedValueOnce(new Error("ads boom"));
    const result = await dispatchStripeWebhook(billingEvent());
    expect(markWebhookProcessed).not.toHaveBeenCalled();
    expect(result.ads.failed).toBe(true);
    expect(result.anyFailed).toBe(true);
  });

  it("does not mark legacy processed when legacy handler throws", async () => {
    const event = {
      id: "evt_legacy",
      type: "checkout.session.completed",
      livemode: false,
      data: { object: { id: "cs_legacy", metadata: {} } },
    } as never;
    handleLegacyStripeEvent.mockRejectedValueOnce(new Error("legacy boom"));
    const result = await dispatchStripeWebhook(event);
    expect(markLegacyWebhookProcessed).not.toHaveBeenCalled();
    expect(result.legacy.failed).toBe(true);
    expect(result.anyFailed).toBe(true);
  });
});
