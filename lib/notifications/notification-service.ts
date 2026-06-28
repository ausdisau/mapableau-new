import type { NotificationCategory } from "@prisma/client";

import { prisma } from "@/lib/prisma";

import { sendPushToTokens } from "./fcm-service";

export async function createNotification(params: {
  userId: string;
  category: NotificationCategory;
  title: string;
  body: string;
}) {
  return prisma.notification.create({ data: params });
}

export async function ensureDefaultPreferences(userId: string) {
  const categories: NotificationCategory[] = [
    "booking",
    "profile",
    "consent",
    "provider",
    "system",
  ];
  const channels = ["in_app", "email", "push"] as const;

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

export async function registerPushDeviceToken(params: {
  userId: string;
  platform: string;
  token: string;
}) {
  return prisma.pushDeviceToken.upsert({
    where: {
      userId_token: {
        userId: params.userId,
        token: params.token,
      },
    },
    create: {
      userId: params.userId,
      platform: params.platform,
      token: params.token,
    },
    update: {
      platform: params.platform,
      lastSeenAt: new Date(),
    },
  });
}

export async function unregisterPushDeviceToken(params: {
  userId: string;
  token: string;
}) {
  return prisma.pushDeviceToken.deleteMany({
    where: {
      userId: params.userId,
      token: params.token,
    },
  });
}

export async function notifyUser(
  userId: string,
  category: NotificationCategory,
  title: string,
  body: string
) {
  const inAppPref = await prisma.notificationPreference.findFirst({
    where: { userId, category, channel: "in_app", enabled: true },
  });

  let notification = null;
  if (inAppPref) {
    notification = await createNotification({ userId, category, title, body });
  }

  const pushPref = await prisma.notificationPreference.findFirst({
    where: { userId, category, channel: "push", enabled: true },
  });

  if (pushPref) {
    const tokens = await prisma.pushDeviceToken.findMany({
      where: { userId },
      select: { token: true },
    });

    if (tokens.length > 0) {
      await sendPushToTokens(
        tokens.map((entry) => entry.token),
        { title, body },
        { category, userId },
      );
    }
  }

  return notification;
}
