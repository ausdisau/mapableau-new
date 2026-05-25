import { notifyUser } from "@/lib/notifications/notification-service";

import { FOOD_NOTIFICATION_COPY, type FoodNotificationKey } from "./notification-copy";

export async function notifyFoodUser(userId: string, key: FoodNotificationKey) {
  const body = FOOD_NOTIFICATION_COPY[key];
  return notifyUser(userId, "booking", "MapAble Foods", body);
}

export async function notifyFoodOrderUpdated(userId: string, status = 'updated') {
  return notifyUser(userId, 'booking', 'MapAble Foods', status === 'delivered' ? FOOD_NOTIFICATION_COPY.delivered : status === 'out_for_delivery' ? FOOD_NOTIFICATION_COPY.deliveryOnWay : FOOD_NOTIFICATION_COPY.orderUpdated);
}

