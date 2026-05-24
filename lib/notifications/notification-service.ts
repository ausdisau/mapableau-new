import type {
  CommunicationChannel,
  NotificationCategory,
  NotificationTemplateKey,
} from "@prisma/client";

import { createAuditEvent } from "@/lib/audit/audit-event-service";
import {
  canSendOnChannel,
  notificationTypeForTemplate,
} from "@/lib/notifications/communication-preferences";
import {
  assertNoSensitiveContent,
  redactMessageBody,
  renderNotificationTemplate,
  type TemplateContext,
} from "@/lib/notifications/message-templates";
import { sendViaTwilio } from "@/lib/notifications/twilio-notification-adapter";
import { prisma } from "@/lib/prisma";

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
  const pref = await prisma.notificationPreference.findFirst({
    where: { userId, category, channel: "in_app", enabled: true },
  });
  if (!pref) return null;
  return createNotification({ userId, category, title, body });
}

export type SendTransactionalNotificationInput = {
  userId: string;
  templateKey: NotificationTemplateKey;
  channel?: CommunicationChannel;
  context?: TemplateContext;
  bookingId?: string;
  tripId?: string;
  invoiceId?: string;
  actorUserId?: string;
  /** Operational override — must be audited when used */
  operationalOverride?: boolean;
  operationalOverrideReason?: string;
};

export async function sendTransactionalNotification(
  input: SendTransactionalNotificationInput
) {
  const notificationType = notificationTypeForTemplate(input.templateKey);
  const channel: CommunicationChannel = input.channel ?? "sms";
  const body = renderNotificationTemplate(input.templateKey, input.context ?? {});
  assertNoSensitiveContent(body);

  const event = await prisma.notificationEvent.create({
    data: {
      userId: input.userId,
      templateKey: input.templateKey,
      channel,
      status: "processing",
      bookingId: input.bookingId,
      tripId: input.tripId,
      invoiceId: input.invoiceId,
      metadata: input.context as object | undefined,
    },
  });

  const consent = await canSendOnChannel({
    userId: input.userId,
    channel,
    notificationType,
    bypassQuietHours: input.operationalOverride,
  });

  if (!consent.allowed && !input.operationalOverride) {
    await prisma.notificationEvent.update({
      where: { id: event.id },
      data: {
        status: "skipped",
        processedAt: new Date(),
        metadata: {
          ...(input.context ?? {}),
          skipReason: consent.reason,
        },
      },
    });
    await createAuditEvent({
      actorUserId: input.actorUserId ?? input.userId,
      action: "notification.skipped_no_consent",
      entityType: "NotificationEvent",
      entityId: event.id,
      participantId: input.userId,
      metadata: { templateKey: input.templateKey, reason: consent.reason },
    });
    return { sent: false, eventId: event.id, reason: consent.reason };
  }

  if (input.operationalOverride) {
    await createAuditEvent({
      actorUserId: input.actorUserId,
      action: "notification.operational_override",
      entityType: "NotificationEvent",
      entityId: event.id,
      participantId: input.userId,
      metadata: {
        templateKey: input.templateKey,
        reason: input.operationalOverrideReason,
      },
    });
  }

  const redactedBody = redactMessageBody(body);
  let twilioSid: string | undefined;
  let deliveryStatus: "queued" | "sent" | "failed" = "queued";
  let errorCode: string | undefined;

  if (channel === "in_app") {
    await notifyUser(
      input.userId,
      notificationType === "billing" ? "billing" : "booking",
      "MapAble update",
      redactedBody
    );
    deliveryStatus = "sent";
  } else if (consent.phoneE164) {
    try {
      const result = await sendViaTwilio({
        channel,
        toE164: consent.phoneE164,
        body: redactedBody,
      });
      twilioSid = result.sid;
      deliveryStatus = result.dryRun ? "queued" : "sent";
    } catch (err) {
      deliveryStatus = "failed";
      errorCode = err instanceof Error ? err.message : "SEND_FAILED";
    }
  }

  const outbound = await prisma.outboundMessage.create({
    data: {
      userId: input.userId,
      notificationEventId: event.id,
      channel,
      templateKey: input.templateKey,
      messageBodyRedacted: redactedBody,
      phoneNumberE164: consent.phoneE164,
      twilioSid,
      deliveryStatus,
      bookingId: input.bookingId,
      tripId: input.tripId,
      invoiceId: input.invoiceId,
      errorCode,
    },
  });

  await prisma.notificationEvent.update({
    where: { id: event.id },
    data: {
      status: deliveryStatus === "failed" ? "failed" : "sent",
      processedAt: new Date(),
    },
  });

  await createAuditEvent({
    actorUserId: input.actorUserId ?? input.userId,
    action: "notification.sent",
    entityType: "OutboundMessage",
    entityId: outbound.id,
    participantId: input.userId,
    metadata: {
      templateKey: input.templateKey,
      channel,
      deliveryStatus,
      twilioSid,
    },
  });

  return {
    sent: deliveryStatus !== "failed",
    eventId: event.id,
    outboundMessageId: outbound.id,
    twilioSid,
  };
}
