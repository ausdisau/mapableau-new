import type { FoodOrderItemCostType } from "@prisma/client";

export type FoodTotalsLine = {
  quantity: number;
  unitPriceCents: number;
  costType: FoodOrderItemCostType;
};

export type FoodOrderTotals = {
  subtotalCents: number;
  preparationCents: number;
  deliveryCents: number;
  supportCents: number;
  taxCents: number;
  totalCents: number;
};

export function calculateFoodOrderTotals(lines: FoodTotalsLine[]): FoodOrderTotals {
  const totals: FoodOrderTotals = {
    subtotalCents: 0,
    preparationCents: 0,
    deliveryCents: 0,
    supportCents: 0,
    taxCents: 0,
    totalCents: 0,
  };

  for (const line of lines) {
    const amount = Math.max(0, Math.round(line.quantity * line.unitPriceCents));
    if (line.costType === "preparation") totals.preparationCents += amount;
    else if (line.costType === "delivery") totals.deliveryCents += amount;
    else if (line.costType === "support_time") totals.supportCents += amount;
    else totals.subtotalCents += amount;
  }

  totals.totalCents =
    totals.subtotalCents +
    totals.preparationCents +
    totals.deliveryCents +
    totals.supportCents +
    totals.taxCents;

  return totals;
}

export function foodLineTotal(quantity: number, unitPriceCents: number) {
  return Math.max(0, Math.round(quantity * unitPriceCents));
}
