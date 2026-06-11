import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  approveInvoice,
  assertHumanApprover,
  rejectInvoice,
} from "@/lib/abilitypay/approval-service";
import { prisma } from "@/lib/prisma";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    abilityPayInvoice: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    abilityPayApprovalEvent: {
      create: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

vi.mock("@/lib/abilitypay/plan-service", () => ({
  recalcBudgetSpent: vi.fn(),
}));

vi.mock("@/lib/abilitypay/audit", () => ({
  logAbilityPayEvent: vi.fn(),
}));

const { recalcBudgetSpent } = await import("@/lib/abilitypay/plan-service");
const { logAbilityPayEvent } = await import("@/lib/abilitypay/audit");

describe("assertHumanApprover", () => {
  it("allows participant, family member, and plan manager", () => {
    expect(() => assertHumanApprover("participant")).not.toThrow();
    expect(() => assertHumanApprover("family_member")).not.toThrow();
    expect(() => assertHumanApprover("plan_manager")).not.toThrow();
  });

  it("rejects non-human approver roles", () => {
    expect(() => assertHumanApprover("provider_admin")).toThrow(
      "HUMAN_APPROVAL_REQUIRED"
    );
    expect(() => assertHumanApprover("mapable_admin")).toThrow(
      "HUMAN_APPROVAL_REQUIRED"
    );
  });
});

describe("approveInvoice", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects provider_admin from approving", async () => {
    await expect(
      approveInvoice({
        invoiceId: "inv1",
        actorUserId: "u1",
        actorRole: "provider_admin",
      })
    ).rejects.toThrow("HUMAN_APPROVAL_REQUIRED");
  });

  it("approves invoice and writes audit event", async () => {
    const invoice = {
      id: "inv1",
      participantId: "p1",
      planId: "plan1",
      status: "awaiting_participant",
    };
    const updated = { ...invoice, status: "approved", paymentStatus: "approved" };
    const event = { id: "evt1" };

    vi.mocked(prisma.abilityPayInvoice.findUnique).mockResolvedValue(
      invoice as never
    );
    vi.mocked(prisma.$transaction).mockResolvedValue([updated, event] as never);

    const result = await approveInvoice({
      invoiceId: "inv1",
      actorUserId: "p1",
      actorRole: "participant",
      notes: "Looks good",
    });

    expect(result.invoice.status).toBe("approved");
    expect(recalcBudgetSpent).toHaveBeenCalledWith("plan1");
    expect(logAbilityPayEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "abilitypay.invoice.approved",
        entityId: "inv1",
        actorUserId: "p1",
      })
    );
  });
});

describe("rejectInvoice", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects invoice and writes audit event", async () => {
    const invoice = {
      id: "inv2",
      participantId: "p1",
      status: "awaiting_participant",
    };
    const updated = { ...invoice, status: "rejected", paymentStatus: "rejected" };
    const event = { id: "evt2" };

    vi.mocked(prisma.abilityPayInvoice.findUnique).mockResolvedValue(
      invoice as never
    );
    vi.mocked(prisma.$transaction).mockResolvedValue([updated, event] as never);

    const result = await rejectInvoice({
      invoiceId: "inv2",
      actorUserId: "p1",
      actorRole: "participant",
      notes: "Wrong dates",
    });

    expect(result.invoice.status).toBe("rejected");
    expect(logAbilityPayEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "abilitypay.invoice.rejected",
        metadata: expect.objectContaining({ notes: "Wrong dates" }),
      })
    );
  });
});
