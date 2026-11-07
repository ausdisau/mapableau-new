import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const constructEvent = vi.fn();
const isStripeSdkAvailable = vi.fn();
const storeWebhookEventIdempotent = vi.fn();
const markWebhookProcessed = vi.fn();
const handleStripeBillingEventImpl = vi.fn();

vi.mock("@/lib/stripe/config", () => ({
  isStripeSdkAvailable: (...args: unknown[]) => isStripeSdkAvailable(...args),
  stripeConfig: {
    webhookSecret: "whsec_test",
    secretKey: "sk_test",
    appUrl: "http://localhost:3000",
    connectClientId: null,
    providerProPriceId: null,
    employerProPriceId: null,
    defaultCurrency: "aud",
  },
  priceIdForSubscriptionPlan: () => null,
}));

vi.mock("@/lib/stripe/client", () => ({
  getStripeClient: () => ({
    webhooks: {
      constructEvent: (...args: unknown[]) => constructEvent(...args),
    },
  }),
}));

vi.mock("@/lib/ads/billing/stripe-webhook", () => ({
  handleAdsStripeEvent: vi.fn(),
  isAdsWalletTopUpEvent: () => false,
}));

vi.mock("@/lib/stripe/legacy-webhooks", () => ({
  handleLegacyStripeEvent: vi.fn(),
  markLegacyWebhookProcessed: vi.fn(),
  storeLegacyWebhookEventIdempotent: vi.fn().mockResolvedValue({
    duplicate: false,
  }),
}));

vi.mock("@/lib/billing/core/account-service", () => ({
  ensureStripeCustomer: vi.fn(),
  updateConnectAccount: vi.fn(),
}));

vi.mock("@/lib/billing/core/invoice-service", () => ({
  updateInvoiceStatus: vi.fn(),
}));

vi.mock("@/lib/billing/core/audit", () => ({
  writeBillingAuditLog: vi.fn(),
}));

vi.mock("@/lib/payouts/block-service", () => ({
  handleDispute: vi.fn(),
  handleRefund: vi.fn(),
}));

vi.mock("@/lib/payouts/recipient-service", () => ({
  syncRecipientFromStripeAccount: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    billingStripeWebhookEvent: {
      findUnique: vi.fn(),
      upsert: vi.fn(),
      update: vi.fn(),
    },
  },
}));

vi.mock("@/lib/billing/core/webhook-handler", async () => {
  const actual = await vi.importActual<
    typeof import("@/lib/billing/core/webhook-handler")
  >("@/lib/billing/core/webhook-handler");
  return {
    ...actual,
    storeWebhookEventIdempotent: (...args: unknown[]) =>
      storeWebhookEventIdempotent(...args),
    markWebhookProcessed: (...args: unknown[]) => markWebhookProcessed(...args),
    handleStripeBillingEvent: (...args: unknown[]) =>
      handleStripeBillingEventImpl(...args),
  };
});

import {
  assertLivemodeMatches,
  StripeLivemodeMismatchError,
} from "@/lib/billing/core/webhook-handler";
import { parseAndProcessWebhookRequest } from "@/lib/stripe/webhooks";

function stripeEvent(overrides: {
  id?: string;
  livemode: boolean;
  type?: string;
}) {
  return {
    id: overrides.id ?? "evt_1",
    livemode: overrides.livemode,
    type: overrides.type ?? "checkout.session.completed",
    data: {
      object: {
        metadata: { invoiceId: "inv-1" },
      },
    },
  };
}

describe("assertLivemodeMatches", () => {
  const previousMode = process.env.MAPABLE_PAYMENTS_MODE;

  afterEach(() => {
    if (previousMode === undefined) delete process.env.MAPABLE_PAYMENTS_MODE;
    else process.env.MAPABLE_PAYMENTS_MODE = previousMode;
  });

  it("allows a test event when MAPABLE_PAYMENTS_MODE=test", () => {
    process.env.MAPABLE_PAYMENTS_MODE = "test";
    expect(() =>
      assertLivemodeMatches(stripeEvent({ livemode: false }) as never),
    ).not.toThrow();
  });

  it("rejects a live event when MAPABLE_PAYMENTS_MODE=test", () => {
    process.env.MAPABLE_PAYMENTS_MODE = "test";
    expect(() =>
      assertLivemodeMatches(stripeEvent({ livemode: true }) as never),
    ).toThrow(StripeLivemodeMismatchError);
  });

  it("rejects a test event when MAPABLE_PAYMENTS_MODE=live", () => {
    process.env.MAPABLE_PAYMENTS_MODE = "live";
    expect(() =>
      assertLivemodeMatches(stripeEvent({ livemode: false }) as never),
    ).toThrow(StripeLivemodeMismatchError);
  });
});

describe("parseAndProcessWebhookRequest livemode fail-closed", () => {
  const previousMode = process.env.MAPABLE_PAYMENTS_MODE;

  beforeEach(() => {
    vi.clearAllMocks();
    isStripeSdkAvailable.mockReturnValue(true);
    storeWebhookEventIdempotent.mockResolvedValue({
      duplicate: false,
      eventRowId: "row-1",
    });
    handleStripeBillingEventImpl.mockResolvedValue(undefined);
    markWebhookProcessed.mockResolvedValue(undefined);
  });

  afterEach(() => {
    if (previousMode === undefined) delete process.env.MAPABLE_PAYMENTS_MODE;
    else process.env.MAPABLE_PAYMENTS_MODE = previousMode;
  });

  it("processes a test event when MAPABLE_PAYMENTS_MODE=test", async () => {
    process.env.MAPABLE_PAYMENTS_MODE = "test";
    constructEvent.mockReturnValue(stripeEvent({ livemode: false }));

    const result = await parseAndProcessWebhookRequest("{}", "sig_test");

    expect(result).toMatchObject({ ok: true });
    expect(handleStripeBillingEventImpl).toHaveBeenCalled();
  });

  it("returns 400 for a live event when MAPABLE_PAYMENTS_MODE=test", async () => {
    process.env.MAPABLE_PAYMENTS_MODE = "test";
    constructEvent.mockReturnValue(stripeEvent({ livemode: true }));

    const result = await parseAndProcessWebhookRequest("{}", "sig_test");

    expect(result).toMatchObject({
      ok: false,
      status: 400,
    });
    if (!result.ok) {
      expect(result.message).toContain("livemode mismatch");
    }
    expect(handleStripeBillingEventImpl).not.toHaveBeenCalled();
    expect(storeWebhookEventIdempotent).not.toHaveBeenCalled();
  });

  it("returns 400 for a test event when MAPABLE_PAYMENTS_MODE=live", async () => {
    process.env.MAPABLE_PAYMENTS_MODE = "live";
    constructEvent.mockReturnValue(stripeEvent({ livemode: false }));

    const result = await parseAndProcessWebhookRequest("{}", "sig_test");

    expect(result).toMatchObject({
      ok: false,
      status: 400,
    });
    expect(handleStripeBillingEventImpl).not.toHaveBeenCalled();
  });
});
