import { prisma } from "@/lib/prisma";
import type { PricingWarning } from "@/types/ndis-pricing";

export type RuleEvaluationContext = {
  supportItemCode?: string | null;
  unitAmountCents: number;
  quantity: number;
  unitType?: string | null;
  priceCapCents?: number | null;
  claimableByNdis?: boolean;
  serviceDate?: Date | null;
};

type RuleJson = {
  type?: string;
  maxUnitCents?: number;
  requiredFields?: string[];
  message?: string;
};

export async function evaluatePriceRules(
  ctx: RuleEvaluationContext
): Promise<PricingWarning[]> {
  const warnings: PricingWarning[] = [];
  const rules = await prisma.ndisPriceRule.findMany({ where: { active: true } });
  const claimRules = await prisma.ndisClaimRule.findMany({ where: { active: true } });

  for (const rule of rules) {
    const r = rule.ruleJson as RuleJson;
    if (r.type === "price_cap" && ctx.priceCapCents != null) {
      if (ctx.unitAmountCents > ctx.priceCapCents) {
        warnings.push({
          code: rule.code,
          severity: "warning",
          message:
            r.message ??
            `Unit amount exceeds catalogue cap (${ctx.priceCapCents} cents).`,
          technicalMessage: `${rule.code}: unit ${ctx.unitAmountCents} > cap ${ctx.priceCapCents}`,
        });
      }
    }
    if (r.type === "required_support_code" && !ctx.supportItemCode?.trim()) {
      warnings.push({
        code: rule.code,
        severity: "warning",
        message: r.message ?? "Support item code missing on line.",
      });
    }
  }

  for (const rule of claimRules) {
    const r = rule.ruleJson as RuleJson;
    if (r.type === "ndis_claim_requires_code" && ctx.claimableByNdis && !ctx.supportItemCode) {
      warnings.push({
        code: rule.code,
        severity: rule.severity === "error" ? "error" : "warning",
        message:
          rule.description ??
          "NDIS-claimable lines should include a support item code for review.",
        technicalMessage: `${rule.code}: claimable without support item code`,
      });
    }
  }

  if (ctx.priceCapCents == null && ctx.supportItemCode) {
    warnings.push({
      code: "missing_catalogue_price",
      severity: "warning",
      message: `No catalogue price found for ${ctx.supportItemCode} — verify manually.`,
    });
  }

  return warnings;
}
