import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { canAccessDocument } from "@/lib/documents/document-service";
import {
  buildViewerContext,
  canSendInThread,
} from "@/lib/messages/message-access-policy";
import { auditMessageSent } from "@/lib/messages/message-audit-service";
import { notifyThreadRecipients } from "@/lib/messages/message-notification-service";
import { notifyUser } from "@/lib/notifications/notification-service";
import { getRealtimeAdapter } from "@/lib/realtime/realtime-adapter";
import { prisma } from "@/lib/prisma";
import type { CurrentUser } from "@/lib/auth/current-user";
import type { Message, MessageType, ThreadType } from "@/types/messages";

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

export async function sendLegacyConversationMessage(params: {
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
  threadId: string;
  sender: CurrentUser;
  body: string;
  messageType?: MessageType;
  attachmentDocumentIds?: string[];
  metadataJson?: Record<string, unknown>;
}): Promise<Message> {
  const sanitized = params.body.trim().slice(0, 10000);
  if (!sanitized) throw new Error("EMPTY_MESSAGE");

  const viewer = await buildViewerContext({
    profileId: params.sender.id,
    primaryRole: params.sender.primaryRole,
    roles: params.sender.roles,
  });

  if (!(await canSendInThread(params.threadId, viewer))) {
    throw new Error("FORBIDDEN");
  }

  if (params.attachmentDocumentIds?.length) {
    for (const documentId of params.attachmentDocumentIds) {
      const doc = await prisma.document.findUnique({ where: { id: documentId } });
      if (!doc) throw new Error("ATTACHMENT_NOT_FOUND");
      const allowed = await canAccessDocument(
        params.sender.id,
        params.sender.primaryRole,
        doc
      );
      if (!allowed) throw new Error("ATTACHMENT_FORBIDDEN");
    }
  }

  const thread = await prisma.communicationThread.findUnique({
    where: { id: params.threadId },
    include: { participants: { where: { leftAt: null } } },
  });
  if (!thread) throw new Error("THREAD_NOT_FOUND");

  const message = await prisma.communicationMessage.create({
    data: {
      threadId: params.threadId,
      senderProfileId: params.sender.id,
      body: sanitized,
      messageType: params.messageType ?? "text",
      status: "sent",
      metadataJson: params.metadataJson
        ? (params.metadataJson as object)
        : undefined,
      attachments: params.attachmentDocumentIds?.length
        ? {
            create: params.attachmentDocumentIds.map((documentId) => ({
              documentId,
              attachmentType: "document",
            })),
          }
        : undefined,
    },
    include: { attachments: true },
  });

  await prisma.communicationThread.update({
    where: { id: params.threadId },
    data: { updatedAt: new Date() },
  });

  const recipientIds = thread.participants.map((p) => p.profileId);
  for (const profileId of recipientIds) {
    if (profileId === params.sender.id) continue;
    await prisma.communicationMessageReceipt.create({
      data: { messageId: message.id, profileId, deliveredAt: new Date() },
    });
  }

  await auditMessageSent({
    actorUserId: params.sender.id,
    actorRole: params.sender.primaryRole,
    threadId: params.threadId,
    messageId: message.id,
    threadType: thread.threadType as ThreadType,
  });

  await notifyThreadRecipients({
    threadId: params.threadId,
    threadType: thread.threadType as ThreadType,
    senderProfileId: params.sender.id,
    recipientProfileIds: recipientIds,
  });

  const mapped: Message = {
    id: message.id,
    threadId: message.threadId,
    senderProfileId: message.senderProfileId,
    messageType: message.messageType as MessageType,
    body: message.body,
    status: message.status as Message["status"],
    metadataJson: (message.metadataJson as Record<string, unknown> | null) ?? null,
    createdAt: message.createdAt.toISOString(),
    editedAt: message.editedAt?.toISOString() ?? null,
    deletedAt: message.deletedAt?.toISOString() ?? null,
    senderDisplayName: params.sender.name,
    attachments: message.attachments.map((a) => ({
      id: a.id,
      messageId: a.messageId,
      documentId: a.documentId,
      attachmentType: a.attachmentType,
      createdAt: a.createdAt.toISOString(),
    })),
  };

  try {
    const adapter = getRealtimeAdapter();
    await adapter.publishMessageCreated(params.threadId, mapped);
  } catch {
    // Realtime is best-effort; DB is source of truth
  }

  return mapped;
}

export async function getLegacyUnreadCount(
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

export async function getUnreadCount(userId: string, threadId: string): Promise<number> {
  const messages = await prisma.communicationMessage.findMany({
    where: {
      threadId,
      deletedAt: null,
      senderProfileId: { not: userId },
    },
    select: { id: true },
  });
  if (!messages.length) return 0;
  const read = await prisma.communicationMessageReceipt.findMany({
    where: {
      profileId: userId,
      messageId: { in: messages.map((m) => m.id) },
      readAt: { not: null },
    },
  });
  return messages.length - read.length;
}
