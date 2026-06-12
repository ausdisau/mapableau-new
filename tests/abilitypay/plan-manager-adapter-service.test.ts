import { beforeEach, describe, expect, it, vi } from "vitest";

import { confirmPlanManagedPayment } from "@/lib/abilitypay/plan-manager-adapter-service";
import { prisma } from "@/lib/prisma";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    abilityPayInvoice: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    abilityPayPaymentAttempt: {
      update: vi.fn(),
      create: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

vi.mock("@/lib/abilitypay/audit", () => ({
  logAbilityPayEvent: vi.fn(),
}));

const { logAbilityPayEvent } = await import("@/lib/abilitypay/audit");

describe("confirmPlanManagedPayment", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects non-plan-manager roles", async () => {
    await expect(
      confirmPlanManagedPayment({
        invoiceId: "inv1",
        actorUserId: "u1",
        actorRole: "participant",
      })
    ).rejects.toThrow("PLAN_MANAGER_REQUIRED");
  });

  it("rejects non-plan-managed invoices", async () => {
    vi.mocked(prisma.abilityPayInvoice.findUnique).mockResolvedValue({
      id: "inv1",
      participantId: "p1",
      status: "approved",
      paymentStatus: "ready_to_pay",
      fundingModel: "self_managed",
      plan: { fundingModel: "self_managed" },
      paymentAttempts: [],
    } as never);

    await expect(
      confirmPlanManagedPayment({
        invoiceId: "inv1",
        actorUserId: "pm1",
        actorRole: "plan_manager",
      })
    ).rejects.toThrow("NOT_PLAN_MANAGED");
  });

  it("marks plan-managed invoice as paid", async () => {
    vi.mocked(prisma.abilityPayInvoice.findUnique).mockResolvedValue({
      id: "inv1",
      participantId: "p1",
      status: "exported",
      paymentStatus: "ready_to_pay",
      fundingModel: "plan_managed",
      plan: { fundingModel: "plan_managed" },
      paymentAttempts: [
        {
          id: "att1",
          adapter: "plan_export",
          status: "processing",
          metadata: { routedAt: "2026-01-01" },
        },
      ],
    } as never);

    vi.mocked(prisma.$transaction).mockImplementation(async (fn) =>
      fn({
        abilityPayInvoice: { update: vi.fn() },
        abilityPayPaymentAttempt: { update: vi.fn(), create: vi.fn() },
      } as never)
    );

    const result = await confirmPlanManagedPayment({
      invoiceId: "inv1",
      actorUserId: "pm1",
      actorRole: "plan_manager",
      notes: "Paid via plan manager portal",
    });

    expect(result).toEqual({ invoiceId: "inv1", paymentStatus: "paid" });
    expect(logAbilityPayEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "abilitypay.payment.paid",
        entityId: "inv1",
      })
    );
  });
});
