export const FOODS_NOTIFICATION_COPY = {
  orderUpdated: "Your MapAble Foods order has been updated.",
  deliveryOnWay: "Your delivery is on the way.",
  delivered: "Your order has been delivered.",
} as const;

export function privacySafeOrderNotification(
  kind: keyof typeof FOODS_NOTIFICATION_COPY
): string {
  return FOODS_NOTIFICATION_COPY[kind];
}
