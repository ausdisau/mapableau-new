import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  getReconciliationSummary,
  listPaymentAttemptsForUser,
} from "@/lib/abilitypay/reconciliation-service";
import { prisma } from "@/lib/prisma";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    planManagerRelationship: {
      findMany: vi.fn(),
    },
    abilityPayPaymentAttempt: {
      findMany: vi.fn(),
      groupBy: vi.fn(),
    },
  },
}));

describe("listPaymentAttemptsForUser", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns empty list for unsupported roles", async () => {
    const rows = await listPaymentAttemptsForUser("u1", "provider_admin");
    expect(rows).toEqual([]);
    expect(prisma.abilityPayPaymentAttempt.findMany).not.toHaveBeenCalled();
  });

  it("maps payment attempts for plan managers", async () => {
    vi.mocked(prisma.planManagerRelationship.findMany).mockResolvedValue([
      { participantId: "p1" },
    ] as never);
    vi.mocked(prisma.abilityPayPaymentAttempt.findMany).mockResolvedValue([
      {
        id: "att1",
        adapter: "stripe_checkout",
        status: "succeeded",
        externalRef: "cs_123",
        failureReason: null,
        createdAt: new Date("2026-06-01"),
        updatedAt: new Date("2026-06-02"),
        invoice: {
          id: "inv1",
          invoiceNumber: "INV-001",
          totalCents: 15000,
          paymentStatus: "paid",
          fundingModel: "self_managed",
          participant: { name: "Alex" },
          provider: { legalName: "Bright Care" },
          plan: { fundingModel: "self_managed" },
        },
      },
    ] as never);

    const rows = await listPaymentAttemptsForUser("pm1", "plan_manager");
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      id: "att1",
      invoiceId: "inv1",
      participantName: "Alex",
      providerName: "Bright Care",
      fundingModel: "Self-managed",
      adapter: "stripe_checkout",
      attemptStatus: "succeeded",
      paymentStatus: "paid",
      totalCents: 15000,
    });
  });
});

describe("getReconciliationSummary", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns null for participants", async () => {
    expect(await getReconciliationSummary("participant")).toBeNull();
  });

  it("aggregates attempt counts for plan managers", async () => {
    vi.mocked(prisma.abilityPayPaymentAttempt.groupBy)
      .mockResolvedValueOnce([
        { status: "succeeded", _count: { id: 3 } },
        { status: "failed", _count: { id: 1 } },
      ] as never)
      .mockResolvedValueOnce([
        { adapter: "stripe_checkout", _count: { id: 2 } },
        { adapter: "plan_export", _count: { id: 2 } },
      ] as never);
    vi.mocked(prisma.abilityPayPaymentAttempt.findMany).mockResolvedValue([]);

    const summary = await getReconciliationSummary("plan_manager");
    expect(summary).toEqual({
      byStatus: { succeeded: 3, failed: 1 },
      byAdapter: { stripe_checkout: 2, plan_export: 2 },
      failedRecent: [],
    });
  });
});
