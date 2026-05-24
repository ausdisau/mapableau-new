import type { FoodOrderItem, MenuItem } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import type { FoodInvoiceSplitView } from "@/types/foods";

type ItemWithMenu = FoodOrderItem & { menuItem: MenuItem };

export function calculateSplitFromItems(
  items: ItemWithMenu[],
  deliveryCents = 500,
): FoodInvoiceSplitView {
  let ingredientCents = 0;
  let preparationCents = 0;
  for (const line of items) {
    ingredientCents +=
      (line.unitIngredientCents || line.menuItem.ingredientCostCents) *
      line.quantity;
    preparationCents +=
      (line.unitPreparationCents || line.menuItem.preparationCostCents) *
      line.quantity;
  }
  const totalCents = ingredientCents + preparationCents + deliveryCents;
  return {
    ingredientCents,
    preparationCents,
    deliveryCents,
    totalCents,
    plainLanguageNote: `This total is split into food ingredients ($${(ingredientCents / 100).toFixed(2)}), meal preparation ($${(preparationCents / 100).toFixed(2)}), and delivery ($${(deliveryCents / 100).toFixed(2)}). MapAble does not decide NDIS funding eligibility — your plan manager or the NDIS can confirm what is claimable.`,
  };
}

export async function persistFoodInvoiceSplit(
  foodOrderId: string,
  split: FoodInvoiceSplitView,
) {
  return prisma.foodInvoiceSplit.upsert({
    where: { foodOrderId },
    create: {
      foodOrderId,
      ingredientCents: split.ingredientCents,
      preparationCents: split.preparationCents,
      deliveryCents: split.deliveryCents,
      totalCents: split.totalCents,
      plainLanguageNote: split.plainLanguageNote,
    },
    update: {
      ingredientCents: split.ingredientCents,
      preparationCents: split.preparationCents,
      deliveryCents: split.deliveryCents,
      totalCents: split.totalCents,
      plainLanguageNote: split.plainLanguageNote,
    },
  });
}
