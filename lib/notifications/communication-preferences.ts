import type {
  CommunicationChannel,
  CommunicationConsentStatus,
} from "@prisma/client";

import { prisma } from "@/lib/prisma";

export const NOTIFICATION_TYPES = [
  "all",
  "booking",
  "transport",
  "billing",
  "support",
  "urgent",
] as const;

export type NotificationType = (typeof NOTIFICATION_TYPES)[number];

const CHANNEL_DEFAULTS: CommunicationChannel[] = [
  "sms",
  "voice",
  "whatsapp",
  "in_app",
];

export async function ensureDefaultCommunicationPreferences(userId: string) {
  for (const channel of CHANNEL_DEFAULTS) {
    for (const notificationType of NOTIFICATION_TYPES) {
      await prisma.communicationPreference.upsert({
        where: {
          userId_channel_notificationType: {
            userId,
            channel,
            notificationType,
          },
        },
        create: {
          userId,
          channel,
          notificationType,
          consentStatus: channel === "in_app" ? "opted_in" : "pending",
          enabled: channel === "in_app",
        },
        update: {},
      });
    }
  }
}

export async function getVerifiedPhoneE164(userId: string): Promise<string | null> {
  const verification = await prisma.phoneVerification.findFirst({
    where: { userId, status: "approved" },
    orderBy: { verifiedAt: "desc" },
  });
  return verification?.phoneNumberE164 ?? null;
}

export function isWithinQuietHours(params: {
  quietHoursStart?: string | null;
  quietHoursEnd?: string | null;
  timezone: string;
  now?: Date;
}): boolean {
  const { quietHoursStart, quietHoursEnd } = params;
  if (!quietHoursStart || !quietHoursEnd) return false;

  const now = params.now ?? new Date();
  const formatter = new Intl.DateTimeFormat("en-AU", {
    timeZone: params.timezone,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const parts = formatter.formatToParts(now);
  const hour = parts.find((p) => p.type === "hour")?.value ?? "00";
  const minute = parts.find((p) => p.type === "minute")?.value ?? "00";
  const current = `${hour}:${minute}`;

  if (quietHoursStart <= quietHoursEnd) {
    return current >= quietHoursStart && current < quietHoursEnd;
  }
  return current >= quietHoursStart || current < quietHoursEnd;
}

export async function canSendOnChannel(params: {
  userId: string;
  channel: CommunicationChannel;
  notificationType: NotificationType;
  bypassQuietHours?: boolean;
}): Promise<{
  allowed: boolean;
  reason?: string;
  phoneE164?: string;
  consentStatus?: CommunicationConsentStatus;
}> {
  const pref = await prisma.communicationPreference.findFirst({
    where: {
      userId: params.userId,
      channel: params.channel,
      notificationType: { in: [params.notificationType, "all"] },
      enabled: true,
    },
    orderBy: { notificationType: "desc" },
  });

  if (!pref) {
    return { allowed: false, reason: "no_preference" };
  }

  if (pref.consentStatus !== "opted_in") {
    return { allowed: false, reason: "no_consent", consentStatus: pref.consentStatus };
  }

  if (
    !params.bypassQuietHours &&
    isWithinQuietHours({
      quietHoursStart: pref.quietHoursStart,
      quietHoursEnd: pref.quietHoursEnd,
      timezone: pref.timezone,
    })
  ) {
    return { allowed: false, reason: "quiet_hours" };
  }

  if (params.channel === "sms" || params.channel === "whatsapp" || params.channel === "voice") {
    const phone =
      pref.phoneNumberE164 ?? (await getVerifiedPhoneE164(params.userId));
    if (!phone) {
      return { allowed: false, reason: "no_verified_phone" };
    }
    return { allowed: true, phoneE164: phone, consentStatus: pref.consentStatus };
  }

  if (params.channel === "in_app") {
    return { allowed: true, consentStatus: pref.consentStatus };
  }

  return { allowed: false, reason: "unsupported_channel" };
}

export function notificationTypeForTemplate(
  templateKey: string
): NotificationType {
  if (templateKey.startsWith("booking_")) return "booking";
  if (templateKey.startsWith("transport_") || templateKey === "trip_completed") {
    return "transport";
  }
  if (templateKey.startsWith("invoice_")) return "billing";
  if (templateKey === "support_message_received") return "support";
  if (templateKey === "urgent_provider_alert") return "urgent";
  return "all";
}
