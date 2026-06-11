import { beforeEach, describe, expect, it, vi } from "vitest";

import { validateAbilityPayInvoice } from "@/lib/abilitypay/invoice-validation-service";
import { checkPriceLimit } from "@/lib/abilitypay/price-guard-service";
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
  checkPriceLimit: vi.fn(),
}));

vi.mock("@/lib/abilitypay/audit", () => ({
  logAbilityPayEvent: vi.fn(),
}));

const baseInvoice = {
  id: "inv1",
  invoiceNumber: "INV-100",
  participantId: "p1",
  providerId: "prov1",
  serviceAgreementLinked: true,
  provider: { abn: "12345678901", legalName: "Test Provider" },
  participant: { participantProfile: { ndisNumber: "123" } },
  lineItems: [
    {
      id: "line1",
      supportItemCode: "01_011_0107_1_1",
      unitPriceCents: 5000,
      serviceDate: new Date("2026-01-15"),
    },
  ],
};

describe("validateAbilityPayInvoice", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(prisma.abilityPayInvoice.findFirst).mockResolvedValue(null);
    vi.mocked(checkPriceLimit).mockResolvedValue({
      status: "pass",
      limitCents: 6000,
      message: "Within limit",
    });
    vi.mocked(prisma.abilityPayRiskFlag.deleteMany).mockResolvedValue({
      count: 0,
    });
    vi.mocked(prisma.abilityPayInvoiceLineItem.update).mockResolvedValue(
      {} as never
    );
    vi.mocked(prisma.abilityPayInvoice.update).mockResolvedValue({} as never);
  });

  it("passes when all required fields are present", async () => {
    vi.mocked(prisma.abilityPayInvoice.findUnique).mockResolvedValue(
      baseInvoice as never
    );

    const result = await validateAbilityPayInvoice("inv1", "actor1");

    expect(result.passed).toBe(true);
    expect(result.failedReasons).toHaveLength(0);
    expect(result.checks.abnPresent).toBe(true);
    expect(result.checks.duplicateInvoice).toBe(false);
    expect(result.checks.priceLimitStatus).toBe("pass");
  });

  it("fails when provider ABN is missing", async () => {
    vi.mocked(prisma.abilityPayInvoice.findUnique).mockResolvedValue({
      ...baseInvoice,
      provider: { abn: "", legalName: "Test Provider" },
    } as never);

    const result = await validateAbilityPayInvoice("inv1");

    expect(result.passed).toBe(false);
    expect(result.checks.abnPresent).toBe(false);
    expect(result.failedReasons).toContain("Provider ABN is missing.");
  });

  it("fails when line item service dates are missing", async () => {
    vi.mocked(prisma.abilityPayInvoice.findUnique).mockResolvedValue({
      ...baseInvoice,
      lineItems: [{ ...baseInvoice.lineItems[0], serviceDate: null }],
    } as never);

    const result = await validateAbilityPayInvoice("inv1");

    expect(result.passed).toBe(false);
    expect(result.checks.datesOfSupportPresent).toBe(false);
  });

  it("records price limit fail status", async () => {
    vi.mocked(prisma.abilityPayInvoice.findUnique).mockResolvedValue(
      baseInvoice as never
    );
    vi.mocked(checkPriceLimit).mockResolvedValue({
      status: "fail",
      limitCents: 4000,
      message: "Unit price exceeds limit",
    });

    const result = await validateAbilityPayInvoice("inv1");

    expect(result.passed).toBe(false);
    expect(result.checks.priceLimitStatus).toBe("fail");
    expect(result.failedReasons).toContain("Unit price exceeds limit");
  });

  it("records warning when price is near limit", async () => {
    vi.mocked(prisma.abilityPayInvoice.findUnique).mockResolvedValue(
      baseInvoice as never
    );
    vi.mocked(checkPriceLimit).mockResolvedValue({
      status: "warning",
      limitCents: 5200,
      message: "Near limit",
    });

    const result = await validateAbilityPayInvoice("inv1");

    expect(result.passed).toBe(true);
    expect(result.checks.priceLimitStatus).toBe("warning");
  });
});
