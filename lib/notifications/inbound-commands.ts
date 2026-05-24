import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { prisma } from "@/lib/prisma";

export type InboundCommand = "YES" | "CANCEL" | "HELP" | "STOP" | "START";

const COMMAND_MAP: Record<string, InboundCommand> = {
  YES: "YES",
  CANCEL: "CANCEL",
  HELP: "HELP",
  STOP: "STOP",
  START: "START",
};

export function parseInboundCommand(body: string): InboundCommand | null {
  const normalized = body.trim().toUpperCase().split(/\s+/)[0] ?? "";
  return COMMAND_MAP[normalized] ?? null;
}

export async function handleInboundCommand(params: {
  userId: string | null;
  fromE164: string;
  command: InboundCommand;
  inboundMessageId: string;
}): Promise<{ reply?: string; handled: boolean }> {
  if (params.command === "HELP") {
    return {
      handled: true,
      reply:
        "MapAble: Reply STOP to opt out of SMS. Reply START to opt back in. For support visit the app or contact support.",
    };
  }

  if (!params.userId) {
    return {
      handled: true,
      reply: "MapAble: We could not match your number. Please sign in to manage preferences.",
    };
  }

  if (params.command === "STOP") {
    await prisma.communicationPreference.updateMany({
      where: {
        userId: params.userId,
        channel: { in: ["sms", "whatsapp", "voice"] },
      },
      data: {
        consentStatus: "opted_out",
        enabled: false,
      },
    });

    await createAuditEvent({
      actorUserId: params.userId,
      action: "communication.opted_out_sms",
      entityType: "InboundMessage",
      entityId: params.inboundMessageId,
      participantId: params.userId,
      metadata: { command: "STOP", from: params.fromE164 },
    });

    return {
      handled: true,
      reply: "MapAble: You are opted out of SMS alerts. Reply START to opt in again.",
    };
  }

  if (params.command === "START") {
    await prisma.communicationPreference.updateMany({
      where: {
        userId: params.userId,
        channel: { in: ["sms", "whatsapp"] },
      },
      data: {
        consentStatus: "opted_in",
        enabled: true,
      },
    });

    await createAuditEvent({
      actorUserId: params.userId,
      action: "communication.opted_in_sms",
      entityType: "InboundMessage",
      entityId: params.inboundMessageId,
      participantId: params.userId,
      metadata: { command: "START", from: params.fromE164 },
    });

    return {
      handled: true,
      reply: "MapAble: You are opted in to SMS alerts. Reply STOP to opt out.",
    };
  }

  if (params.command === "CANCEL") {
    await createAuditEvent({
      actorUserId: params.userId,
      action: "communication.inbound_cancel",
      entityType: "InboundMessage",
      entityId: params.inboundMessageId,
      participantId: params.userId,
    });
    return {
      handled: true,
      reply: "MapAble: To cancel a booking, please use the app or contact support.",
    };
  }

  if (params.command === "YES") {
    await createAuditEvent({
      actorUserId: params.userId,
      action: "communication.inbound_yes",
      entityType: "InboundMessage",
      entityId: params.inboundMessageId,
      participantId: params.userId,
    });
    return { handled: true };
  }

  return { handled: false };
}

export async function findUserIdByPhoneE164(
  phoneE164: string
): Promise<string | null> {
  const verification = await prisma.phoneVerification.findFirst({
    where: { phoneNumberE164: phoneE164, status: "approved" },
    orderBy: { verifiedAt: "desc" },
  });
  if (verification) return verification.userId;

  const user = await prisma.user.findFirst({
    where: { phone: phoneE164 },
    select: { id: true },
  });
  return user?.id ?? null;
}
