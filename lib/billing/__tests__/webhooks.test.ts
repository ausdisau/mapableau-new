import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    stripeWebhookEvent: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    invoice: { findUnique: vi.fn(), update: vi.fn() },
    payment: {
      findFirst: vi.fn(),
      update: vi.fn(),
      create: vi.fn(),
    },
    subscription: { upsert: vi.fn() },
    billingAccount: { findFirst: vi.fn(), update: vi.fn() },
    auditLog: { create: vi.fn() },
  },
}));

import { storeWebhookEvent } from "@/lib/billing/webhooks";
import { prisma } from "@/lib/prisma";

describe("webhook idempotency", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns duplicate when stripeEventId already exists", async () => {
    vi.mocked(prisma.stripeWebhookEvent.findUnique).mockResolvedValue({
      id: "rec_1",
      stripeEventId: "evt_1",
      type: "checkout.session.completed",
      processed: true,
      payload: {},
      createdAt: new Date(),
      processedAt: new Date(),
    });

    const result = await storeWebhookEvent({
      id: "evt_1",
      type: "checkout.session.completed",
      data: { object: {} },
    } as never);

    expect(result.isDuplicate).toBe(true);
    expect(result.recordId).toBe("rec_1");
    expect(prisma.stripeWebhookEvent.create).not.toHaveBeenCalled();
  });

  it("creates record for new events", async () => {
    vi.mocked(prisma.stripeWebhookEvent.findUnique).mockResolvedValue(null);
    vi.mocked(prisma.stripeWebhookEvent.create).mockResolvedValue({
      id: "rec_new",
      stripeEventId: "evt_2",
      type: "payment_intent.succeeded",
      processed: false,
      payload: {},
      createdAt: new Date(),
      processedAt: null,
    });

    const result = await storeWebhookEvent({
      id: "evt_2",
      type: "payment_intent.succeeded",
      data: { object: {} },
    } as never);

    expect(result.isDuplicate).toBe(false);
    expect(result.recordId).toBe("rec_new");
    expect(prisma.stripeWebhookEvent.create).toHaveBeenCalledOnce();
  });
});

describe("subscription status updates", () => {
  it("exports subscription webhook handler", async () => {
    const { handleStripeWebhookEvent } = await import("@/lib/billing/webhooks");
    expect(typeof handleStripeWebhookEvent).toBe("function");
  });
});

describe("Connect onboarding status updates", () => {
  it("exports account.updated handler utilities", async () => {
    const mod = await import("@/lib/billing/webhooks");
    expect(mod.handleStripeWebhookEvent).toBeDefined();
    expect(mod.markWebhookProcessed).toBeDefined();
  });
});
