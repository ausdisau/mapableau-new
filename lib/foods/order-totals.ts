import type { FoodOrderItemCostType } from "@prisma/client";

export type OrderLineInput = {
  titleSnapshot: string;
  quantity: number;
  unitAmount: number;
  itemCostType: FoodOrderItemCostType;
  dietaryTagsSnapshot?: unknown;
  allergenTagsSnapshot?: unknown;
  productId?: string;
};

export type OrderTotals = {
  subtotalAmount: number;
  deliveryFeeAmount: number;
  preparationFeeAmount: number;
  supportFeeAmount: number;
  taxAmount: number;
  totalAmount: number;
  foodItemTotal: number;
  preparationTotal: number;
  deliveryTotal: number;
  supportTotal: number;
};

export function computeOrderTotals(params: {
  lines: OrderLineInput[];
  deliveryFeeAmount?: number;
  preparationFeeAmount?: number;
  supportFeeAmount?: number;
  taxRateBps?: number;
}): OrderTotals {
  let foodItemTotal = 0;
  let preparationTotal = 0;
  let deliveryTotal = params.deliveryFeeAmount ?? 0;
  let supportTotal = params.supportFeeAmount ?? 0;

  for (const line of params.lines) {
    const lineTotal = line.unitAmount * line.quantity;
    switch (line.itemCostType) {
      case "preparation":
        preparationTotal += lineTotal;
        break;
      case "delivery":
        deliveryTotal += lineTotal;
        break;
      case "support_time":
        supportTotal += lineTotal;
        break;
      case "food_item":
      case "packaging":
      case "other":
      default:
        foodItemTotal += lineTotal;
    }
  }

  preparationTotal += params.preparationFeeAmount ?? 0;

  const subtotalAmount = foodItemTotal + preparationTotal;
  const taxBps = params.taxRateBps ?? 0;
  const taxable = subtotalAmount + deliveryTotal + supportTotal;
  const taxAmount = Math.round((taxable * taxBps) / 10000);
  const totalAmount = taxable + taxAmount;

  return {
    subtotalAmount,
    deliveryFeeAmount: deliveryTotal,
    preparationFeeAmount: preparationTotal,
    supportFeeAmount: supportTotal,
    taxAmount,
    totalAmount,
    foodItemTotal,
    preparationTotal,
    deliveryTotal,
    supportTotal,
  };
}

export function orderBlocksPayment(status: string, paymentStatus: string): boolean {
  if (status === "cancelled" || status === "disputed") return true;
  if (paymentStatus === "paid" || paymentStatus === "blocked") return true;
  return false;
}
