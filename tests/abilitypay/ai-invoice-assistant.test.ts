import { beforeEach, describe, expect, it, vi } from "vitest";

import { getAiInvoiceSuggestions } from "@/lib/abilitypay/ai-invoice-assistant";
import { validateAbilityPayInvoice } from "@/lib/abilitypay/invoice-validation-service";
import { prisma } from "@/lib/prisma";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    abilityPayInvoice: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    abilityPayRiskFlag: {
      findFirst: vi.fn(),
      create: vi.fn(),
    },
  },
}));

vi.mock("@/lib/abilitypay/invoice-validation-service", () => ({
  validateAbilityPayInvoice: vi.fn(),
}));

const validationPass = {
  passed: true,
  checks: {
    abnPresent: true,
    invoiceNumberPresent: true,
    participantIdentifierPresent: true,
    providerIdentifierPresent: true,
    datesOfSupportPresent: true,
    supportItemCodePresent: true,
    supportItemPricePresent: true,
    duplicateInvoice: false,
    priceLimitStatus: "pass" as const,
    serviceAgreementLinked: true,
  },
  failedReasons: [],
  checkedAt: new Date().toISOString(),
};

describe("getAiInvoiceSuggestions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(validateAbilityPayInvoice).mockResolvedValue(validationPass);
    vi.mocked(prisma.abilityPayInvoice.update).mockResolvedValue({} as never);
    vi.mocked(prisma.abilityPayRiskFlag.findFirst).mockResolvedValue(null);
  });

  it("returns suggestions with disclaimer and does not approve invoices", async () => {
    vi.mocked(prisma.abilityPayInvoice.findUnique).mockResolvedValue({
      id: "inv1",
      validationJson: validationPass,
      lineItems: [
        { supportItemCode: "04_104_0125_6_1", description: "Community access" },
      ],
      plan: {
        categories: [{ name: "Core", categoryCode: "01" }],
      },
      provider: { legalName: "Provider Co" },
      riskFlags: [],
    } as never);

    const suggestion = await getAiInvoiceSuggestions("inv1");

    expect(suggestion.disclaimer).toContain("Only you or your nominee can approve");
    expect(suggestion.draftQuestions.length).toBeGreaterThan(0);
    expect(suggestion.invoiceType).toBe("community_participation");

    const updateCalls = vi.mocked(prisma.abilityPayInvoice.update).mock.calls;
    for (const [args] of updateCalls) {
      expect(args.data).not.toHaveProperty("status", "approved");
      expect(args.data).not.toHaveProperty("paymentStatus", "approved");
    }
  });

  it("lists missing fields from validation without mutating approval state", async () => {
    vi.mocked(prisma.abilityPayInvoice.findUnique).mockResolvedValue({
      id: "inv2",
      validationJson: null,
      lineItems: [],
      plan: { categories: [] },
      provider: null,
      riskFlags: [],
    } as never);

    vi.mocked(validateAbilityPayInvoice).mockResolvedValue({
      ...validationPass,
      passed: false,
      checks: {
        ...validationPass.checks,
        abnPresent: false,
        serviceAgreementLinked: false,
      },
      failedReasons: ["Provider ABN is missing."],
    });

    const suggestion = await getAiInvoiceSuggestions("inv2");

    expect(suggestion.missingFields).toContain("Provider ABN");
    expect(suggestion.missingFields).toContain("Service agreement link");
    expect(prisma.abilityPayRiskFlag.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ flagType: "ai_suggested" }),
      })
    );
  });

  it("does not create duplicate ai_suggested risk flags", async () => {
    vi.mocked(prisma.abilityPayInvoice.findUnique).mockResolvedValue({
      id: "inv3",
      validationJson: {
        ...validationPass,
        checks: { ...validationPass.checks, abnPresent: false },
      },
      lineItems: [],
      plan: { categories: [] },
      provider: null,
      riskFlags: [],
    } as never);

    vi.mocked(prisma.abilityPayRiskFlag.findFirst).mockResolvedValue({
      id: "existing-flag",
    } as never);

    await getAiInvoiceSuggestions("inv3");

    expect(prisma.abilityPayRiskFlag.create).not.toHaveBeenCalled();
  });
});
