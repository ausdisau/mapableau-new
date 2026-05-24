import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { hashWebhookPayload } from "@/lib/communications/phone-verification-service";
import {
  findUserIdByPhoneE164,
  handleInboundCommand,
  parseInboundCommand,
} from "@/lib/notifications/inbound-commands";
import { redactMessageBody } from "@/lib/notifications/message-templates";
import { prisma } from "@/lib/prisma";

export async function recordTwilioWebhookEvent(params: {
  eventType: string;
  payload: Record<string, string>;
  twilioSid?: string;
}) {
  return prisma.twilioWebhookEvent.create({
    data: {
      eventType: params.eventType,
      twilioSid: params.twilioSid,
      payloadHash: hashWebhookPayload(params.payload),
      payloadMeta: {
        MessageSid: params.payload.MessageSid,
        MessageStatus: params.payload.MessageStatus,
        From: params.payload.From?.slice(-4)
          ? `***${params.payload.From.slice(-4)}`
          : undefined,
        To: params.payload.To?.slice(-4)
          ? `***${params.payload.To.slice(-4)}`
          : undefined,
      },
    },
  });
}

export async function processStatusWebhook(payload: Record<string, string>) {
  const messageSid = payload.MessageSid ?? payload.SmsSid;
  const status = payload.MessageStatus ?? payload.SmsStatus;

  if (!messageSid) return { updated: false };

  const outbound = await prisma.outboundMessage.findFirst({
    where: { twilioSid: messageSid },
  });

  if (outbound) {
    const deliveryStatus = mapTwilioStatus(status);
    await prisma.outboundMessage.update({
      where: { id: outbound.id },
      data: {
        deliveryStatus,
        errorCode: payload.ErrorCode,
      },
    });

    await createAuditEvent({
      actorUserId: outbound.userId,
      action: "notification.delivery_updated",
      entityType: "OutboundMessage",
      entityId: outbound.id,
      participantId: outbound.userId,
      metadata: { status, messageSid },
    });
    return { updated: true, outboundMessageId: outbound.id };
  }

  return { updated: false };
}

function mapTwilioStatus(
  status?: string
): "queued" | "sent" | "delivered" | "failed" | "undelivered" | "read" {
  switch (status?.toLowerCase()) {
    case "delivered":
      return "delivered";
    case "sent":
      return "sent";
    case "failed":
    case "undelivered":
      return status.toLowerCase() === "failed" ? "failed" : "undelivered";
    case "read":
      return "read";
    default:
      return "sent";
  }
}

export async function processInboundSmsWebhook(payload: Record<string, string>) {
  const from = payload.From?.replace(/^whatsapp:/, "") ?? "";
  const body = payload.Body ?? "";
  const sid = payload.MessageSid ?? payload.SmsSid;

  const userId = await findUserIdByPhoneE164(from);
  const command = parseInboundCommand(body);

  const inbound = await prisma.inboundMessage.create({
    data: {
      userId,
      channel: payload.From?.startsWith("whatsapp:") ? "whatsapp" : "sms",
      fromNumberE164: from,
      messageBodyRedacted: redactMessageBody(body),
      command: command ?? undefined,
      twilioSid: sid,
      metadata: { hasCommand: Boolean(command) },
    },
  });

  await createAuditEvent({
    actorUserId: userId ?? undefined,
    action: "communication.inbound_received",
    entityType: "InboundMessage",
    entityId: inbound.id,
    participantId: userId ?? undefined,
    metadata: { command },
  });

  let reply: string | undefined;
  if (command) {
    const result = await handleInboundCommand({
      userId,
      fromE164: from,
      command,
      inboundMessageId: inbound.id,
    });
    reply = result.reply;
    await prisma.inboundMessage.update({
      where: { id: inbound.id },
      data: { processed: result.handled },
    });
  }

  return { inboundMessageId: inbound.id, reply, userId };
}

export async function processInboundVoiceWebhook(payload: Record<string, string>) {
  const from = payload.From ?? "";
  const userId = await findUserIdByPhoneE164(from);

  const inbound = await prisma.inboundMessage.create({
    data: {
      userId,
      channel: "voice",
      fromNumberE164: from,
      messageBodyRedacted: "[voice]",
      twilioSid: payload.CallSid,
      metadata: { callStatus: payload.CallStatus },
    },
  });

  await createAuditEvent({
    actorUserId: userId ?? undefined,
    action: "communication.inbound_voice",
    entityType: "InboundMessage",
    entityId: inbound.id,
    participantId: userId ?? undefined,
  });

  return { inboundMessageId: inbound.id, userId };
}
