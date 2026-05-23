import { prisma } from "@/lib/prisma";

export async function getBookingThreadId(
  bookingId: string
): Promise<string | null> {
  const thread = await prisma.conversation.findFirst({
    where: { bookingId, type: "booking_thread" },
    select: { id: true },
  });
  return thread?.id ?? null;
}

export async function postSystemMessage(params: {
  conversationId: string;
  senderUserId: string;
  body: string;
  plainLanguageSummary?: string;
}) {
  const message = await prisma.message.create({
    data: {
      conversationId: params.conversationId,
      senderUserId: params.senderUserId,
      body: params.body,
      plainLanguageSummary: params.plainLanguageSummary ?? params.body,
      isSystemMessage: true,
    },
  });

  await prisma.conversation.update({
    where: { id: params.conversationId },
    data: { lastMessageAt: new Date() },
  });

  return message;
}

export async function postBookingSystemMessage(params: {
  bookingId: string;
  senderUserId: string;
  body: string;
  plainLanguageSummary?: string;
}) {
  const threadId = await getBookingThreadId(params.bookingId);
  if (!threadId) return null;
  return postSystemMessage({
    conversationId: threadId,
    senderUserId: params.senderUserId,
    body: params.body,
    plainLanguageSummary: params.plainLanguageSummary,
  });
}

export async function ensureBookingThread(params: {
  bookingId: string;
  participantId: string;
  organisationId?: string | null;
  createdById: string;
  title: string;
}) {
  const existing = await prisma.conversation.findFirst({
    where: { bookingId: params.bookingId, type: "booking_thread" },
  });
  if (existing) return existing;

  const conversation = await prisma.conversation.create({
    data: {
      type: "booking_thread",
      title: params.title,
      bookingId: params.bookingId,
      participantId: params.participantId,
      organisationId: params.organisationId ?? undefined,
      createdById: params.createdById,
      lastMessageAt: new Date(),
      participants: {
        create: [
          {
            userId: params.participantId,
            roleInThread: "participant",
          },
          {
            userId: params.createdById,
            roleInThread:
              params.createdById === params.participantId
                ? "participant"
                : "nominee",
          },
        ],
      },
    },
    include: { participants: true },
  });

  if (params.organisationId) {
    const orgMembers = await prisma.organisationMember.findMany({
      where: { organisationId: params.organisationId },
      select: { userId: true },
      take: 20,
    });
    for (const member of orgMembers) {
      if (
        member.userId === params.participantId ||
        member.userId === params.createdById
      ) {
        continue;
      }
      await prisma.conversationParticipant.upsert({
        where: {
          conversationId_userId: {
            conversationId: conversation.id,
            userId: member.userId,
          },
        },
        create: {
          conversationId: conversation.id,
          userId: member.userId,
          roleInThread: "provider_admin",
        },
        update: {},
      });
    }
  }

  return conversation;
}

export async function addWorkerToBookingThread(params: {
  bookingId: string;
  workerUserId: string;
}) {
  const thread = await prisma.conversation.findFirst({
    where: { bookingId: params.bookingId, type: "booking_thread" },
  });
  if (!thread) return null;

  return prisma.conversationParticipant.upsert({
    where: {
      conversationId_userId: {
        conversationId: thread.id,
        userId: params.workerUserId,
      },
    },
    create: {
      conversationId: thread.id,
      userId: params.workerUserId,
      roleInThread: "support_worker",
    },
    update: { roleInThread: "support_worker" },
  });
}
