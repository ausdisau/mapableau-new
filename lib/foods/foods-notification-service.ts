import { notifyUser } from "@/lib/notifications/notification-service";

import {
  privacySafeOrderNotification,
  type FOODS_NOTIFICATION_COPY,
} from "./notification-copy";

export async function notifyFoodsParticipant(
  userId: string,
  kind: keyof typeof FOODS_NOTIFICATION_COPY,
  orderId: string
) {
  const title = privacySafeOrderNotification(kind);
  return notifyUser(userId, "booking", title, title);
}
