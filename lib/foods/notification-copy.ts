export const FOOD_NOTIFICATION_COPY = {
  updated: "Your MapAble Foods order has been updated.",
  onTheWay: "Your delivery is on the way.",
  orderUpdated: "Your MapAble Foods order has been updated.",
  deliveryOnWay: "Your delivery is on the way.",
  delivered: "Your order has been delivered.",
  invoiceReviewRequested: "A MapAble Foods invoice is ready for review.",
  disputeUpdated: "Your MapAble Foods support request has been updated.",
} as const;

export type FoodNotificationKey = keyof typeof FOOD_NOTIFICATION_COPY;

export function foodNotificationBody(status?: string) {
  if (status === "out_for_delivery") return FOOD_NOTIFICATION_COPY.onTheWay;
  if (status === "delivered") return FOOD_NOTIFICATION_COPY.delivered;
  return FOOD_NOTIFICATION_COPY.updated;
}

