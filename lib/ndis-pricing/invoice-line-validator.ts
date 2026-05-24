import { checkInvoiceLinePriceWarning } from "@/lib/ndis-pricing/catalogue-import-service";
import { evaluatePriceRules } from "@/lib/ndis-pricing/price-rule-engine";
import {
  enrichWarningsForAudience,
  explainWarning,
} from "@/lib/ndis-pricing/plain-language-pricing-explainer";
import { getSupportItemByCode } from "@/lib/ndis-pricing/support-item-service";
import type { validateInvoiceLineSchema, InvoiceLineValidationResult } from "@/types/ndis-pricing";
import { NDIS_DISCLAIMER } from "@/types/ndis-pricing";
import type { z } from "zod";

export type ValidateInvoiceLineInput = z.infer<typeof validateInvoiceLineSchema>;

export async function validateInvoiceLine(
  input: ValidateInvoiceLineInput,
  audience: "participant" | "provider" | "admin" = "provider"
): Promise<InvoiceLineValidationResult> {
  let priceCapCents: number | null = null;
  let unitType = input.unitType ?? null;

  if (input.supportItemCode) {
    const detail = await getSupportItemByCode(input.supportItemCode);
    const latest = detail?.item.cataloguePrices[0];
    priceCapCents = latest?.priceCapCents ?? detail?.item.priceCapCents ?? null;
    unitType = unitType ?? latest?.unitType ?? detail?.item.unitType ?? null;
  }

  const catalogueWarning = await checkInvoiceLinePriceWarning(
    input.supportItemCode,
    input.unitAmountCents
  );

  let warnings = await evaluatePriceRules({
    supportItemCode: input.supportItemCode,
    unitAmountCents: input.unitAmountCents,
    quantity: input.quantity,
    unitType,
    priceCapCents,
    claimableByNdis: input.claimableByNdis,
    serviceDate: input.serviceDate ? new Date(input.serviceDate) : null,
  });

  if (catalogueWarning) {
    warnings.push({
      code: catalogueWarning.warningType,
      severity: "warning",
      message: catalogueWarning.message,
    });
  }

  warnings = enrichWarningsForAudience(warnings, audience);

  const findings = warnings.map((w) => ({
    ...w,
    plainMessage: explainWarning(w, audience),
  }));

  const hasError = warnings.some((w) => w.severity === "error");

  return {
    valid: !hasError,
    warnings,
    findings,
    disclaimer: NDIS_DISCLAIMER,
  };
}
