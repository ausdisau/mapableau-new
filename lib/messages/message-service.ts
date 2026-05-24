import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { recordBookingTimelineEvent } from "@/lib/bookings/timeline-service";
import { notifyUser } from "@/lib/notifications/notification-service";
import { prisma } from "@/lib/prisma";

export async function userCanAccessConversation(
  userId: string,
  conversationId: string,
  isAdmin: boolean
): Promise<boolean> {
  if (isAdmin) return true;
  const participant = await prisma.conversationParticipant.findUnique({
    where: { conversationId_userId: { conversationId, userId } },
  });
  return Boolean(participant);
}

export async function markThreadRead(userId: string, conversationId: string) {
  await prisma.conversationParticipant.updateMany({
    where: { conversationId, userId },
    data: { lastReadAt: new Date() },
  });

  const unread = await prisma.message.findMany({
    where: {
      conversationId,
      deletedAt: null,
      senderUserId: { not: userId },
    },
    select: { id: true },
  });

  for (const msg of unread) {
    await prisma.messageReadReceipt.upsert({
      where: { messageId_userId: { messageId: msg.id, userId } },
      create: { messageId: msg.id, userId },
      update: { readAt: new Date() },
    });
  }
}

export async function assertCanCreateThread(params: {
  createdById: string;
  memberUserIds: string[];
  bookingId?: string;
  threadType: string;
}) {
  if (params.bookingId) {
    const booking = await prisma.booking.findUnique({
      where: { id: params.bookingId },
      select: { participantId: true, assignedOrganisationId: true },
    });
    if (!booking) throw new Error("BOOKING_NOT_FOUND");

    const allowedIds = new Set<string>([booking.participantId]);
    if (booking.assignedOrganisationId) {
      const members = await prisma.organisationMember.findMany({
        where: { organisationId: booking.assignedOrganisationId },
        select: { userId: true },
      });
      members.forEach((m) => allowedIds.add(m.userId));
    }

    for (const memberId of params.memberUserIds) {
      if (!allowedIds.has(memberId) && memberId !== params.createdById) {
        throw new Error("THREAD_MEMBER_NOT_ALLOWED");
      }
    }
    return;
  }

  if (
    params.threadType !== "participant_admin" &&
    params.threadType !== "support_ticket_thread"
  ) {
    throw new Error("THREAD_REQUIRES_RELATIONSHIP");
  }
}

export async function createConversation(params: {
  type: string;
  title: string;
  createdById: string;
  bookingId?: string;
  organisationId?: string;
  participantId?: string;
  memberUserIds: string[];
}) {
  await assertCanCreateThread({
    createdById: params.createdById,
    memberUserIds: params.memberUserIds,
    bookingId: params.bookingId,
    threadType: params.type,
  });

  const uniqueMembers = Array.from(
    new Set([params.createdById, ...params.memberUserIds])
  );

  return prisma.conversation.create({
    data: {
      type: params.type as never,
      title: params.title,
      bookingId: params.bookingId,
      organisationId: params.organisationId,
      participantId: params.participantId,
      createdById: params.createdById,
      participants: {
        create: uniqueMembers.map((userId) => ({
          userId,
          roleInThread:
            userId === params.participantId ? "participant" : "provider_admin",
        })),
      },
    },
    include: { participants: true },
  });
}

export async function sendSystemMessageToThread(params: {
  conversationId: string;
  senderUserId: string;
  body: string;
}) {
  const member = await prisma.conversationParticipant.findUnique({
    where: {
      conversationId_userId: {
        conversationId: params.conversationId,
        userId: params.senderUserId,
      },
    },
  });
  if (!member) throw new Error("NOT_THREAD_MEMBER");

  return prisma.message.create({
    data: {
      conversationId: params.conversationId,
      senderUserId: params.senderUserId,
      body: params.body,
      isSystemMessage: true,
      plainLanguageSummary: params.body,
    },
  });
}

export async function listConversationsForUser(userId: string, isAdmin: boolean) {
  if (isAdmin) {
    return prisma.conversation.findMany({
      orderBy: { lastMessageAt: "desc" },
      take: 100,
      include: {
        participants: { include: { user: { select: { id: true, name: true } } } },
      },
    });
  }
  return prisma.conversation.findMany({
    where: { participants: { some: { userId } } },
    orderBy: { lastMessageAt: "desc" },
    include: {
      participants: { include: { user: { select: { id: true, name: true } } } },
    },
  });
}

export async function sendMessage(params: {
  conversationId: string;
  senderUserId: string;
  body: string;
  plainLanguageSummary?: string;
  attachmentDocumentIds?: string[];
}) {
  const sanitized = params.body.trim().slice(0, 10000);
  if (!sanitized) throw new Error("EMPTY_MESSAGE");

  const message = await prisma.message.create({
    data: {
      conversationId: params.conversationId,
      senderUserId: params.senderUserId,
      body: sanitized,
      plainLanguageSummary: params.plainLanguageSummary,
      attachmentDocumentIds: params.attachmentDocumentIds ?? [],
    },
  });

  await prisma.conversation.update({
    where: { id: params.conversationId },
    data: { lastMessageAt: new Date() },
  });

  const conv = await prisma.conversation.findUnique({
    where: { id: params.conversationId },
    include: { participants: true },
  });

  if (conv?.bookingId) {
    await recordBookingTimelineEvent({
      bookingId: conv.bookingId,
      eventType: "message_sent",
      title: "New message in booking conversation",
      actorUserId: params.senderUserId,
    });
  }

  for (const p of conv?.participants ?? []) {
    if (p.userId === params.senderUserId) continue;
    await notifyUser(
      p.userId,
      "support",
      "New message",
      "You have a new secure message in MapAble."
    );
  }

  return message;
}

export async function logAdminConversationAccess(params: {
  actorUserId: string;
  actorRole: string;
  conversationId: string;
  participantId?: string;
}) {
  await createAuditEvent({
    actorUserId: params.actorUserId,
    actorRole: params.actorRole as never,
    action: "admin.accessed_sensitive_record",
    entityType: "Conversation",
    entityId: params.conversationId,
    participantId: params.participantId,
    metadata: { context: "participant_provider_messaging" },
  });
}

export async function getUnreadCount(
  userId: string,
  conversationId: string
): Promise<number> {
  const messages = await prisma.message.findMany({
    where: {
      conversationId,
      deletedAt: null,
      senderUserId: { not: userId },
    },
    select: { id: true },
  });
  if (!messages.length) return 0;
  const read = await prisma.messageReadReceipt.findMany({
    where: {
      userId,
      messageId: { in: messages.map((m) => m.id) },
    },
  });
  return messages.length - read.length;
}
