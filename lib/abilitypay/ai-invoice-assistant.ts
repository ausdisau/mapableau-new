import { prisma } from "@/lib/prisma";
import type { AiInvoiceSuggestion, InvoiceValidationResult } from "@/types/abilitypay";

import { validateAbilityPayInvoice } from "./invoice-validation-service";

const AI_DISCLAIMER =
  "AI helps you review. Only you or your nominee can approve payments.";

export async function getAiInvoiceSuggestions(
  invoiceId: string
): Promise<AiInvoiceSuggestion> {
  const invoice = await prisma.abilityPayInvoice.findUnique({
    where: { id: invoiceId },
    include: {
      lineItems: true,
      plan: { include: { categories: true } },
      provider: true,
      riskFlags: { where: { resolved: false } },
    },
  });

  if (!invoice) {
    throw new Error("INVOICE_NOT_FOUND");
  }

  let validation: InvoiceValidationResult | null = null;
  if (invoice.validationJson) {
    validation = invoice.validationJson as InvoiceValidationResult;
  } else {
    validation = await validateAbilityPayInvoice(invoiceId);
  }

  const missingFields: string[] = [];
  if (!validation.checks.abnPresent) missingFields.push("Provider ABN");
  if (!validation.checks.invoiceNumberPresent) missingFields.push("Invoice number");
  if (!validation.checks.providerIdentifierPresent) missingFields.push("Provider");
  if (!validation.checks.datesOfSupportPresent) missingFields.push("Dates of support");
  if (!validation.checks.supportItemCodePresent) missingFields.push("Support item codes");
  if (!validation.checks.supportItemPricePresent) missingFields.push("Line item prices");
  if (!validation.checks.serviceAgreementLinked) missingFields.push("Service agreement link");

  const categories = invoice.plan?.categories ?? [];
  const categorySuggestions = invoice.lineItems.map((line, index) => {
    const match = categories.find(
      (c) =>
        line.supportItemCode &&
        c.categoryCode &&
        line.supportItemCode.startsWith(c.categoryCode.slice(0, 2))
    );
    return {
      lineIndex: index,
      categoryName: match?.name ?? categories[0]?.name ?? "Core supports",
      confidence: match ? 0.75 : 0.4,
    };
  });

  const draftQuestions: string[] = [];
  if (!validation.checks.abnPresent) {
    draftQuestions.push("Can you confirm your business ABN for this invoice?");
  }
  if (validation.checks.duplicateInvoice) {
    draftQuestions.push(
      "We may have received this invoice before. Can you confirm the invoice number and dates of support?"
    );
  }
  if (validation.checks.priceLimitStatus === "fail") {
    draftQuestions.push(
      "One or more line items appear above the NDIS price limit. Can you review the unit prices?"
    );
  }
  if (draftQuestions.length === 0) {
    draftQuestions.push(
      "Please confirm the dates of support and support item codes match the services delivered."
    );
  }

  let invoiceType = "support_services";
  if (invoice.lineItems.some((l) => l.supportItemCode?.startsWith("04"))) {
    invoiceType = "community_participation";
  } else if (invoice.lineItems.some((l) => l.supportItemCode?.startsWith("09"))) {
    invoiceType = "transport";
  }

  const suggestion: AiInvoiceSuggestion = {
    invoiceType,
    missingFields,
    categorySuggestions,
    draftQuestions,
    duplicateLikely: validation.checks.duplicateInvoice,
    disclaimer: AI_DISCLAIMER,
  };

  await prisma.abilityPayInvoice.update({
    where: { id: invoiceId },
    data: { aiSuggestionsJson: suggestion },
  });

  if (missingFields.length > 0) {
    const existing = await prisma.abilityPayRiskFlag.findFirst({
      where: { invoiceId, flagType: "ai_suggested", resolved: false },
    });
    if (!existing) {
      await prisma.abilityPayRiskFlag.create({
        data: {
          invoiceId,
          flagType: "ai_suggested",
          severity: "info",
          message: `AI noted ${missingFields.length} missing or unclear field(s). Review before approving.`,
        },
      });
    }
  }

  return suggestion;
}
