import type { AbilityPayRiskFlagType, AbilityPayRiskSeverity } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import type { InvoiceValidationResult } from "@/types/abilitypay";

import { logAbilityPayEvent } from "./audit";
import { checkPriceLimit } from "./price-guard-service";

type RiskFlagInput = {
  flagType: AbilityPayRiskFlagType;
  severity: AbilityPayRiskSeverity;
  message: string;
  fieldKey?: string;
};

export async function validateAbilityPayInvoice(
  invoiceId: string,
  actorUserId?: string
): Promise<InvoiceValidationResult> {
  const invoice = await prisma.abilityPayInvoice.findUnique({
    where: { id: invoiceId },
    include: {
      provider: true,
      lineItems: true,
      participant: { include: { participantProfile: true } },
    },
  });

  if (!invoice) {
    throw new Error("INVOICE_NOT_FOUND");
  }

  const failedReasons: string[] = [];
  const riskFlags: RiskFlagInput[] = [];

  const abnPresent = Boolean(invoice.provider?.abn?.trim());
  if (!abnPresent) {
    failedReasons.push("Provider ABN is missing.");
    riskFlags.push({
      flagType: "missing_field",
      severity: "error",
      message: "Provider ABN is missing.",
      fieldKey: "abn",
    });
  }

  const invoiceNumberPresent = Boolean(invoice.invoiceNumber?.trim());
  if (!invoiceNumberPresent) {
    failedReasons.push("Invoice number is missing.");
    riskFlags.push({
      flagType: "missing_field",
      severity: "error",
      message: "Invoice number is missing.",
      fieldKey: "invoiceNumber",
    });
  }

  const participantIdentifierPresent = Boolean(invoice.participantId);
  if (!participantIdentifierPresent) {
    failedReasons.push("Participant identifier is missing.");
    riskFlags.push({
      flagType: "missing_field",
      severity: "error",
      message: "Participant identifier is missing.",
      fieldKey: "participantId",
    });
  }

  const providerIdentifierPresent = Boolean(invoice.providerId);
  if (!providerIdentifierPresent) {
    failedReasons.push("Provider identifier is missing.");
    riskFlags.push({
      flagType: "missing_field",
      severity: "error",
      message: "Provider identifier is missing.",
      fieldKey: "providerId",
    });
  }

  const datesOfSupportPresent =
    invoice.lineItems.length > 0 &&
    invoice.lineItems.every((line) => Boolean(line.serviceDate));
  if (!datesOfSupportPresent) {
    failedReasons.push("Dates of support are missing on one or more line items.");
    riskFlags.push({
      flagType: "missing_field",
      severity: "error",
      message: "Dates of support are required on all line items.",
      fieldKey: "serviceDate",
    });
  }

  const supportItemCodePresent =
    invoice.lineItems.length > 0 &&
    invoice.lineItems.every((line) => Boolean(line.supportItemCode?.trim()));
  if (!supportItemCodePresent) {
    failedReasons.push("Support item code is missing on one or more line items.");
    riskFlags.push({
      flagType: "missing_field",
      severity: "warning",
      message: "Support item codes help match your plan budget.",
      fieldKey: "supportItemCode",
    });
  }

  const supportItemPricePresent =
    invoice.lineItems.length > 0 &&
    invoice.lineItems.every((line) => line.unitPriceCents > 0);
  if (!supportItemPricePresent) {
    failedReasons.push("Support item price is missing or zero on one or more lines.");
    riskFlags.push({
      flagType: "missing_field",
      severity: "error",
      message: "Each line item needs a unit price.",
      fieldKey: "unitPriceCents",
    });
  }

  let duplicateInvoice = false;
  if (
    invoice.invoiceNumber?.trim() &&
    invoice.providerId &&
    invoice.participantId
  ) {
    const duplicate = await prisma.abilityPayInvoice.findFirst({
      where: {
        id: { not: invoice.id },
        invoiceNumber: invoice.invoiceNumber.trim(),
        providerId: invoice.providerId,
        participantId: invoice.participantId,
        status: { notIn: ["rejected"] },
      },
    });
    duplicateInvoice = Boolean(duplicate);
    if (duplicateInvoice) {
      failedReasons.push("A duplicate invoice may already exist for this provider and number.");
      riskFlags.push({
        flagType: "duplicate",
        severity: "error",
        message: "This invoice number may already exist for this provider.",
        fieldKey: "invoiceNumber",
      });
    }
  }

  let overallPriceStatus: "pass" | "warning" | "fail" | "unknown" = "pass";
  for (const line of invoice.lineItems) {
    const guard = await checkPriceLimit(line.supportItemCode, line.unitPriceCents);
    await prisma.abilityPayInvoiceLineItem.update({
      where: { id: line.id },
      data: { priceLimitStatus: guard.status },
    });
    if (guard.status === "fail") {
      overallPriceStatus = "fail";
      failedReasons.push(guard.message);
      riskFlags.push({
        flagType: "price_over_limit",
        severity: "error",
        message: guard.message,
        fieldKey: `line:${line.id}`,
      });
    } else if (guard.status === "warning" && overallPriceStatus !== "fail") {
      overallPriceStatus = "warning";
      riskFlags.push({
        flagType: "price_over_limit",
        severity: "warning",
        message: guard.message,
        fieldKey: `line:${line.id}`,
      });
    } else if (guard.status === "unknown" && overallPriceStatus === "pass") {
      overallPriceStatus = "unknown";
    }
  }

  if (!invoice.serviceAgreementLinked) {
    riskFlags.push({
      flagType: "service_agreement_missing",
      severity: "warning",
      message: "No service agreement is linked to this invoice.",
      fieldKey: "serviceAgreementLinked",
    });
  }

  const checks = {
    abnPresent,
    invoiceNumberPresent,
    participantIdentifierPresent,
    providerIdentifierPresent,
    datesOfSupportPresent,
    supportItemCodePresent,
    supportItemPricePresent,
    duplicateInvoice,
    priceLimitStatus: overallPriceStatus,
    serviceAgreementLinked: invoice.serviceAgreementLinked,
  };

  const result: InvoiceValidationResult = {
    passed: failedReasons.length === 0,
    checks,
    failedReasons,
    checkedAt: new Date().toISOString(),
  };

  await prisma.abilityPayRiskFlag.deleteMany({ where: { invoiceId } });
  if (riskFlags.length > 0) {
    await prisma.abilityPayRiskFlag.createMany({
      data: riskFlags.map((flag) => ({
        invoiceId,
        flagType: flag.flagType,
        severity: flag.severity,
        message: flag.message,
        fieldKey: flag.fieldKey,
      })),
    });
  }

  await prisma.abilityPayInvoice.update({
    where: { id: invoiceId },
    data: { validationJson: result },
  });

  if (actorUserId) {
    await logAbilityPayEvent({
      action: "abilitypay.invoice.validated",
      entityType: "AbilityPayInvoice",
      entityId: invoiceId,
      actorUserId,
      participantId: invoice.participantId,
      metadata: { passed: result.passed, failedCount: failedReasons.length },
    });
  }

  return result;
}
