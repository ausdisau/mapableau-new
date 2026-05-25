import type { NotificationCategory } from "@prisma/client";

import {
  dispatchExternalNotifications,
  type NotificationDispatchOptions,
} from "@/lib/notifications/notification-dispatcher";
import { prisma } from "@/lib/prisma";

const DEFAULT_CATEGORIES: NotificationCategory[] = [
  "booking",
  "profile",
  "consent",
  "provider",
  "billing",
  "support",
  "safeguarding",
  "system",
];

export async function createNotification(params: {
  userId: string;
  category: NotificationCategory;
  title: string;
  body: string;
}) {
  return prisma.notification.create({ data: params });
}

export async function ensureDefaultPreferences(userId: string) {
  const enabledByDefault = ["in_app", "email"] as const;
  const optInChannels = ["sms", "push"] as const;

  for (const category of DEFAULT_CATEGORIES) {
    for (const channel of enabledByDefault) {
      await prisma.notificationPreference.upsert({
        where: {
          userId_category_channel: { userId, category, channel },
        },
        create: { userId, category, channel, enabled: true },
        update: {},
      });
    }
    for (const channel of optInChannels) {
      await prisma.notificationPreference.upsert({
        where: {
          userId_category_channel: { userId, category, channel },
        },
        create: { userId, category, channel, enabled: false },
        update: {},
      });
    }
  }
}

export async function notifyUser(
  userId: string,
  category: NotificationCategory,
  title: string,
  body: string,
  options?: NotificationDispatchOptions
) {
  let notification = null;

  const inAppPref = await prisma.notificationPreference.findFirst({
    where: { userId, category, channel: "in_app", enabled: true },
  });
  if (inAppPref) {
    notification = await createNotification({ userId, category, title, body });
  }

  await dispatchExternalNotifications({
    userId,
    category,
    title,
    body,
    options,
  });

  return notification;
}
