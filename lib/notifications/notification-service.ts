import type { NotificationCategory } from "@prisma/client";

import { dispatchEmailNotification } from "@/lib/notifications/adapters/email-adapter";
import { dispatchPushNotification } from "@/lib/notifications/adapters/push-adapter";
import { dispatchSmsNotification } from "@/lib/notifications/adapters/sms-adapter";
import { prisma } from "@/lib/prisma";

export async function createNotification(params: {
  userId: string;
  category: NotificationCategory;
  title: string;
  body: string;
  channel?: string;
  notificationType?: string;
  actionUrl?: string;
}) {
  return prisma.notification.create({
    data: {
      userId: params.userId,
      category: params.category,
      title: params.title,
      body: params.body,
      channel: params.channel ?? "in_app",
      notificationType: params.notificationType,
      actionUrl: params.actionUrl,
    },
  });
}

export async function ensureDefaultPreferences(userId: string) {
  const categories: NotificationCategory[] = [
    "booking",
    "profile",
    "consent",
    "provider",
    "system",
    "billing",
    "support",
  ];
  const channels = ["in_app", "email"] as const;

  for (const category of categories) {
    for (const channel of channels) {
      await prisma.notificationPreference.upsert({
        where: {
          userId_category_channel: { userId, category, channel },
        },
        create: { userId, category, channel, enabled: true },
        update: {},
      });
    }
  }
}

export async function notifyUser(
  userId: string,
  category: NotificationCategory,
  title: string,
  body: string
) {
  return notifyUserWithAction({ userId, category, title, body });
}

export async function notifyUserWithAction(params: {
  userId: string;
  category: NotificationCategory;
  title: string;
  body: string;
  notificationType?: string;
  actionUrl?: string;
}) {
  const pref = await prisma.notificationPreference.findFirst({
    where: {
      userId: params.userId,
      category: params.category,
      channel: "in_app",
      enabled: true,
    },
  });

  let notification = null;
  if (pref) {
    notification = await createNotification({
      userId: params.userId,
      category: params.category,
      title: params.title,
      body: params.body,
      channel: "in_app",
      notificationType: params.notificationType,
      actionUrl: params.actionUrl,
    });
  }

  await dispatchEmailNotification(params);
  await dispatchSmsNotification(params);
  await dispatchPushNotification(params);

  return notification;
}
