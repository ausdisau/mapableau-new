import { beforeEach, describe, expect, it, vi } from "vitest";

import { validateAbilityPayInvoice } from "@/lib/abilitypay/invoice-validation-service";
import { prisma } from "@/lib/prisma";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    abilityPayInvoice: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
    },
    abilityPayInvoiceLineItem: {
      update: vi.fn(),
    },
    abilityPayRiskFlag: {
      deleteMany: vi.fn(),
      createMany: vi.fn(),
    },
  },
}));

vi.mock("@/lib/abilitypay/price-guard-service", () => ({
  checkPriceLimit: vi.fn().mockResolvedValue({
    status: "pass",
    limitCents: 6000,
    message: "Within limit",
  }),
}));

vi.mock("@/lib/abilitypay/audit", () => ({
  logAbilityPayEvent: vi.fn(),
}));

const invoiceFixture = {
  id: "inv-current",
  invoiceNumber: "INV-42",
  participantId: "participant-1",
  providerId: "provider-1",
  serviceAgreementLinked: true,
  provider: { abn: "12345678901" },
  participant: { participantProfile: {} },
  lineItems: [
    {
      id: "line1",
      supportItemCode: "01_011_0107_1_1",
      unitPriceCents: 5000,
      serviceDate: new Date("2026-02-01"),
    },
  ],
};

describe("duplicate invoice detection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(prisma.abilityPayRiskFlag.deleteMany).mockResolvedValue({
      count: 0,
    });
    vi.mocked(prisma.abilityPayInvoiceLineItem.update).mockResolvedValue(
      {} as never
    );
    vi.mocked(prisma.abilityPayInvoice.update).mockResolvedValue({} as never);
  });

  it("flags duplicate when same number, provider, and participant exist", async () => {
    vi.mocked(prisma.abilityPayInvoice.findUnique).mockResolvedValue(
      invoiceFixture as never
    );
    vi.mocked(prisma.abilityPayInvoice.findFirst).mockResolvedValue({
      id: "inv-other",
      invoiceNumber: "INV-42",
    } as never);

    const result = await validateAbilityPayInvoice("inv-current");

    expect(result.checks.duplicateInvoice).toBe(true);
    expect(result.passed).toBe(false);
    expect(result.failedReasons.some((r) => r.includes("duplicate"))).toBe(
      true
    );
    expect(prisma.abilityPayInvoice.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          invoiceNumber: "INV-42",
          providerId: "provider-1",
          participantId: "participant-1",
          id: { not: "inv-current" },
        }),
      })
    );
  });

  it("does not flag duplicate when no matching invoice exists", async () => {
    vi.mocked(prisma.abilityPayInvoice.findUnique).mockResolvedValue(
      invoiceFixture as never
    );
    vi.mocked(prisma.abilityPayInvoice.findFirst).mockResolvedValue(null);

    const result = await validateAbilityPayInvoice("inv-current");

    expect(result.checks.duplicateInvoice).toBe(false);
  });

  it("skips duplicate check when invoice number is blank", async () => {
    vi.mocked(prisma.abilityPayInvoice.findUnique).mockResolvedValue({
      ...invoiceFixture,
      invoiceNumber: "   ",
    } as never);

    const result = await validateAbilityPayInvoice("inv-current");

    expect(prisma.abilityPayInvoice.findFirst).not.toHaveBeenCalled();
    expect(result.checks.duplicateInvoice).toBe(false);
  });
});
