import type { Prisma, ThreadType } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import {
  buildViewerContext,
  canViewThread,
} from "@/lib/messages/message-access-policy";
import { auditThreadAccess } from "@/lib/messages/message-audit-service";
import type { CurrentUser } from "@/lib/auth/current-user";
import type { ConversationThread, ViewerContext } from "@/types/messages";

function mapThread(
  row: Prisma.CommunicationThreadGetPayload<{
    include: { participants: true; messages: { take: 1; orderBy: { createdAt: "desc" } } };
  }>
): ConversationThread {
  const last = row.messages[0];
  return {
    id: row.id,
    threadType: row.threadType as ConversationThread["threadType"],
    title: row.title,
    participantId: row.participantId,
    providerId: row.providerId,
    bookingId: row.bookingId,
    transportTripId: row.transportTripId,
    invoiceId: row.invoiceId,
    serviceAgreementId: row.serviceAgreementId,
    supportTicketId: row.supportTicketId,
    incidentId: row.incidentId,
    complaintId: row.complaintId,
    status: row.status,
    createdBy: row.createdById,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    participants: row.participants.map((p) => ({
      id: p.id,
      threadId: p.threadId,
      profileId: p.profileId,
      role: p.role,
      displayName: p.displayName,
      canSend: p.canSend,
      canAttachFiles: p.canAttachFiles,
      muted: p.muted,
      blocked: p.blocked,
      joinedAt: p.joinedAt.toISOString(),
      leftAt: p.leftAt?.toISOString() ?? null,
    })),
    lastMessagePreview: last?.deletedAt ? null : last?.body?.slice(0, 120) ?? null,
  };
}

export async function getInbox(profileId: string, user: CurrentUser) {
  const viewer = await buildViewerContext({
    profileId,
    primaryRole: user.primaryRole,
    roles: user.roles,
  });

  const participantThreads = await prisma.communicationThread.findMany({
    where: {
      participants: { some: { profileId, leftAt: null } },
    },
    orderBy: { updatedAt: "desc" },
    take: 100,
    include: {
      participants: true,
      messages: {
        where: { deletedAt: null },
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  });

  const visible: ConversationThread[] = [];
  for (const row of participantThreads) {
    if (await canViewThread(row, viewer)) {
      visible.push(mapThread(row));
    }
  }
  return visible;
}

export async function getThread(threadId: string, user: CurrentUser) {
  const viewer = await buildViewerContext({
    profileId: user.id,
    primaryRole: user.primaryRole,
    roles: user.roles,
  });

  const row = await prisma.communicationThread.findUnique({
    where: { id: threadId },
    include: {
      participants: true,
      messages: {
        where: { deletedAt: null },
        orderBy: { createdAt: "asc" },
        take: 200,
        include: {
          sender: { select: { id: true, name: true } },
          attachments: true,
          receipts: true,
        },
      },
    },
  });

  if (!row) return null;
  if (!(await canViewThread(row, viewer))) return null;

  await auditThreadAccess({
    actorUserId: user.id,
    actorRole: user.primaryRole,
    threadId,
    threadType: row.threadType as ConversationThread["threadType"],
    participantId: row.participantId,
    action: "view",
  });

  return {
    thread: mapThread({
      ...row,
      messages: row.messages.length ? [row.messages[row.messages.length - 1]!] : [],
    }),
    messages: row.messages.map((m) => ({
      id: m.id,
      threadId: m.threadId,
      senderProfileId: m.senderProfileId,
      messageType: m.messageType,
      body: m.body,
      status: m.status,
      metadataJson: (m.metadataJson as Record<string, unknown> | null) ?? null,
      createdAt: m.createdAt.toISOString(),
      editedAt: m.editedAt?.toISOString() ?? null,
      deletedAt: m.deletedAt?.toISOString() ?? null,
      senderDisplayName: m.sender.name,
      attachments: m.attachments.map((a) => ({
        id: a.id,
        messageId: a.messageId,
        documentId: a.documentId,
        attachmentType: a.attachmentType,
        createdAt: a.createdAt.toISOString(),
      })),
      receipts: m.receipts.map((r) => ({
        id: r.id,
        messageId: r.messageId,
        profileId: r.profileId,
        deliveredAt: r.deliveredAt?.toISOString() ?? null,
        readAt: r.readAt?.toISOString() ?? null,
      })),
    })),
    viewer,
  };
}

async function createThreadBase(params: {
  threadType: ThreadType;
  title: string;
  createdById: string;
  participantRows: {
    profileId: string;
    role: string;
    displayName: string;
    canSend?: boolean;
    canAttachFiles?: boolean;
  }[];
  links?: Partial<{
    participantId: string;
    providerId: string;
    bookingId: string;
    transportTripId: string;
    invoiceId: string;
    serviceAgreementId: string;
    supportTicketId: string;
    incidentId: string;
    complaintId: string;
  }>;
}) {
  const ids = new Set(params.participantRows.map((p) => p.profileId));
  ids.add(params.createdById);

  const thread = await prisma.communicationThread.create({
    data: {
      threadType: params.threadType,
      title: params.title,
      createdById: params.createdById,
      participantId: params.links?.participantId,
      providerId: params.links?.providerId,
      bookingId: params.links?.bookingId,
      transportTripId: params.links?.transportTripId,
      invoiceId: params.links?.invoiceId,
      serviceAgreementId: params.links?.serviceAgreementId,
      supportTicketId: params.links?.supportTicketId,
      incidentId: params.links?.incidentId,
      complaintId: params.links?.complaintId,
      participants: {
        create: [...ids].map((profileId) => {
          const row = params.participantRows.find((p) => p.profileId === profileId);
          return {
            profileId,
            role: row?.role ?? "member",
            displayName: row?.displayName ?? "Member",
            canSend: row?.canSend ?? true,
            canAttachFiles: row?.canAttachFiles ?? true,
          };
        }),
      },
    },
    include: { participants: true, messages: true },
  });

  return mapThread({ ...thread, messages: [] });
}

export async function createDirectThread(params: {
  createdBy: CurrentUser;
  otherProfileId: string;
  otherDisplayName: string;
  title?: string;
}) {
  const creator = params.createdBy;
  return createThreadBase({
    threadType: "direct",
    title: params.title ?? `Chat with ${params.otherDisplayName}`,
    createdById: creator.id,
    participantRows: [
      { profileId: creator.id, role: creator.primaryRole, displayName: creator.name },
      {
        profileId: params.otherProfileId,
        role: "member",
        displayName: params.otherDisplayName,
      },
    ],
  });
}

export async function createGroupThread(params: {
  createdBy: CurrentUser;
  title: string;
  participants: {
    profileId: string;
    role: string;
    displayName: string;
  }[];
}) {
  return createThreadBase({
    threadType: "group",
    title: params.title,
    createdById: params.createdBy.id,
    participantRows: [
      {
        profileId: params.createdBy.id,
        role: params.createdBy.primaryRole,
        displayName: params.createdBy.name,
      },
      ...params.participants,
    ],
  });
}

export async function createBookingThread(params: {
  createdBy: CurrentUser;
  bookingId: string;
  title: string;
  participantId: string;
  providerId?: string;
  participants: { profileId: string; role: string; displayName: string }[];
}) {
  return createThreadBase({
    threadType: "booking",
    title: params.title,
    createdById: params.createdBy.id,
    links: {
      bookingId: params.bookingId,
      participantId: params.participantId,
      providerId: params.providerId,
    },
    participantRows: params.participants,
  });
}

export async function createInvoiceThread(params: {
  createdBy: CurrentUser;
  invoiceId: string;
  title: string;
  participantId: string;
  participants: { profileId: string; role: string; displayName: string }[];
}) {
  return createThreadBase({
    threadType: "invoice",
    title: params.title,
    createdById: params.createdBy.id,
    links: { invoiceId: params.invoiceId, participantId: params.participantId },
    participantRows: params.participants,
  });
}

export async function muteThread(threadId: string, profileId: string) {
  await prisma.communicationThreadMute.upsert({
    where: { threadId_profileId: { threadId, profileId } },
    create: { threadId, profileId },
    update: { mutedUntil: null },
  });
  await prisma.communicationThreadParticipant.update({
    where: { threadId_profileId: { threadId, profileId } },
    data: { muted: true },
  });
}

export async function blockUser(blockerProfileId: string, blockedProfileId: string) {
  await prisma.blockedChatUser.upsert({
    where: {
      blockerProfileId_blockedProfileId: { blockerProfileId, blockedProfileId },
    },
    create: { blockerProfileId, blockedProfileId },
    update: {},
  });
}

export type { ViewerContext };
