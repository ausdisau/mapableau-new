import { beforeEach, describe, expect, it, vi } from "vitest";

import { createDraftInvoiceFromCareServiceLog } from "@/lib/abilitypay/care-intake-service";
import { prisma } from "@/lib/prisma";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    abilityPayInvoice: {
      findFirst: vi.fn(),
      create: vi.fn(),
    },
    careServiceLog: {
      findUnique: vi.fn(),
    },
    abilityPayProvider: {
      findFirst: vi.fn(),
    },
    abilityPayParticipantPlan: {
      findFirst: vi.fn(),
    },
  },
}));

vi.mock("@/lib/abilitypay/invoice-validation-service", () => ({
  validateAbilityPayInvoice: vi.fn(),
}));

vi.mock("@/lib/abilitypay/audit", () => ({
  logAbilityPayEvent: vi.fn(),
}));

const { validateAbilityPayInvoice } = await import(
  "@/lib/abilitypay/invoice-validation-service"
);

describe("createDraftInvoiceFromCareServiceLog", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns existing invoice when already linked", async () => {
    const existing = { id: "inv-existing", sourceRefId: "log1" };
    vi.mocked(prisma.abilityPayInvoice.findFirst).mockResolvedValue(
      existing as never
    );

    const result = await createDraftInvoiceFromCareServiceLog({
      careServiceLogId: "log1",
      actorUserId: "u1",
      actorRole: "plan_manager",
    });

    expect(result).toEqual({ invoice: existing, created: false });
    expect(prisma.careServiceLog.findUnique).not.toHaveBeenCalled();
  });

  it("rejects unconfirmed care logs", async () => {
    vi.mocked(prisma.abilityPayInvoice.findFirst).mockResolvedValue(null);
    vi.mocked(prisma.careServiceLog.findUnique).mockResolvedValue({
      id: "log1",
      status: "submitted",
      participantId: "p1",
      organisationId: "org1",
    } as never);

    await expect(
      createDraftInvoiceFromCareServiceLog({
        careServiceLogId: "log1",
        actorUserId: "u1",
        actorRole: "plan_manager",
      })
    ).rejects.toThrow("CARE_LOG_NOT_CONFIRMED");
  });

  it("creates draft invoice from confirmed care log", async () => {
    const serviceDate = new Date("2026-06-01T10:00:00Z");
    vi.mocked(prisma.abilityPayInvoice.findFirst).mockResolvedValue(null);
    vi.mocked(prisma.careServiceLog.findUnique).mockResolvedValue({
      id: "log1",
      status: "confirmed",
      participantId: "p1",
      organisationId: "org1",
      supportsDelivered: [
        {
          name: "Support coordination",
          quantity: 2,
          unitPriceCents: 5000,
          supportItemCode: "07_001_0106_8_3",
        },
      ],
      durationMinutes: 120,
      confirmedAt: serviceDate,
      submittedAt: serviceDate,
      createdAt: serviceDate,
      notes: "Weekly session",
      careShift: { startAt: serviceDate },
      careBooking: null,
    } as never);
    vi.mocked(prisma.abilityPayProvider.findFirst).mockResolvedValue({
      id: "prov1",
    } as never);
    vi.mocked(prisma.abilityPayParticipantPlan.findFirst).mockResolvedValue({
      id: "plan1",
      fundingModel: "plan_managed",
    } as never);

    const createdInvoice = {
      id: "inv-new",
      sourceType: "care_service_log",
      sourceRefId: "log1",
      totalCents: 10000,
      lineItems: [{ description: "Support coordination" }],
      provider: { legalName: "Test Provider" },
    };
    vi.mocked(prisma.abilityPayInvoice.create).mockResolvedValue(
      createdInvoice as never
    );

    const result = await createDraftInvoiceFromCareServiceLog({
      careServiceLogId: "log1",
      actorUserId: "u1",
      actorRole: "plan_manager",
    });

    expect(result.created).toBe(true);
    expect(result.invoice).toEqual(createdInvoice);
    expect(prisma.abilityPayInvoice.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          sourceType: "care_service_log",
          sourceRefId: "log1",
          participantId: "p1",
          providerId: "prov1",
          planId: "plan1",
        }),
      })
    );
    expect(validateAbilityPayInvoice).toHaveBeenCalledWith("inv-new");
  });
});
