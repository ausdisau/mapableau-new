import type { ConferenceMode, ConferenceProvider } from "@prisma/client";

import { createAuditEvent } from "@/lib/audit/audit-event-service";
import {
  buildViewerContext,
  canViewThread,
} from "@/lib/messages/message-access-policy";
import { isSensitiveThreadType } from "@/lib/messages/message-audit-service";
import { sendMessage } from "@/lib/messages/message-service";
import { getConferenceAdapter } from "@/lib/conference/conference-adapter";
import { prisma } from "@/lib/prisma";
import type { CurrentUser } from "@/lib/auth/current-user";
import type { ConferenceSession as ConferenceSessionDto } from "@/types/messages";
import type { ThreadType } from "@/types/messages";

function mapSession(
  row: {
    id: string;
    threadId: string;
    mode: ConferenceMode;
    provider: ConferenceProvider;
    externalRoomId: string;
    status: string;
    createdById: string;
    startedAt: Date;
    endedAt: Date | null;
  },
  extras?: { token?: string; roomUrl?: string }
): ConferenceSessionDto {
  return {
    id: row.id,
    threadId: row.threadId,
    mode: row.mode as ConferenceSessionDto["mode"],
    provider: row.provider,
    externalRoomId: row.externalRoomId,
    status: row.status as ConferenceSessionDto["status"],
    createdBy: row.createdById,
    startedAt: row.startedAt.toISOString(),
    endedAt: row.endedAt?.toISOString() ?? null,
    token: extras?.token,
    roomUrl: extras?.roomUrl,
  };
}

export async function canStartConference(
  threadId: string,
  user: CurrentUser
): Promise<boolean> {
  const thread = await prisma.communicationThread.findUnique({
    where: { id: threadId },
  });
  if (!thread) return false;
  const viewer = await buildViewerContext({
    profileId: user.id,
    primaryRole: user.primaryRole,
    roles: user.roles,
  });
  return canViewThread(thread, viewer);
}

export async function getActiveConference(
  threadId: string,
  user: CurrentUser
): Promise<ConferenceSessionDto | null> {
  if (!(await canStartConference(threadId, user))) return null;

  const session = await prisma.conferenceSession.findFirst({
    where: { threadId, status: "active" },
    orderBy: { startedAt: "desc" },
  });
  if (!session) return null;
  return mapSession(session);
}

export async function startConference(params: {
  threadId: string;
  mode: ConferenceMode;
  user: CurrentUser;
}): Promise<ConferenceSessionDto> {
  const thread = await prisma.communicationThread.findUnique({
    where: { id: params.threadId },
  });
  if (!thread) throw new Error("THREAD_NOT_FOUND");

  const viewer = await buildViewerContext({
    profileId: params.user.id,
    primaryRole: params.user.primaryRole,
    roles: params.user.roles,
  });
  if (!(await canViewThread(thread, viewer))) throw new Error("FORBIDDEN");

  const existing = await prisma.conferenceSession.findFirst({
    where: { threadId: params.threadId, status: "active" },
  });
  if (existing) {
    const adapter = getConferenceAdapter();
    const token = await adapter.createMeetingToken({
      externalRoomId: existing.externalRoomId,
      profileId: params.user.id,
      displayName: params.user.name,
      mode: existing.mode as "audio" | "video",
    });
    await prisma.conferenceParticipant.upsert({
      where: {
        sessionId_profileId: {
          sessionId: existing.id,
          profileId: params.user.id,
        },
      },
      create: {
        sessionId: existing.id,
        profileId: params.user.id,
      },
      update: { leftAt: null },
    });
    return mapSession(existing, token);
  }

  const adapter = getConferenceAdapter();
  const provider =
    process.env.CONFERENCE_PROVIDER === "daily" && process.env.DAILY_API_KEY
      ? "daily"
      : "mock";

  const room = await adapter.createRoom({
    threadId: params.threadId,
    mode: params.mode,
  });

  const session = await prisma.conferenceSession.create({
    data: {
      threadId: params.threadId,
      mode: params.mode,
      provider: provider as ConferenceProvider,
      externalRoomId: room.externalRoomId,
      status: "active",
      createdById: params.user.id,
      participants: {
        create: { profileId: params.user.id },
      },
    },
  });

  const token = await adapter.createMeetingToken({
    externalRoomId: room.externalRoomId,
    profileId: params.user.id,
    displayName: params.user.name,
    mode: params.mode,
  });

  if (isSensitiveThreadType(thread.threadType as ThreadType)) {
    await createAuditEvent({
      actorUserId: params.user.id,
      actorRole: params.user.primaryRole as never,
      action: "admin.accessed_sensitive_record",
      entityType: "ConferenceSession",
      entityId: session.id,
      participantId: thread.participantId ?? undefined,
      metadata: { action: "conference.started", mode: params.mode },
    });
  }

  const modeLabel = params.mode === "video" ? "Video" : "Audio";
  await sendMessage({
    threadId: params.threadId,
    sender: params.user,
    body: `${modeLabel} call started. You can join from the Call tab.`,
    messageType: "telehealth_link",
    metadataJson: {
      conferenceSessionId: session.id,
      mode: params.mode,
      joinHint: "Use the Call tab to join",
    },
  });

  return mapSession(session, { ...token, roomUrl: token.roomUrl ?? room.roomUrl });
}

export async function endConference(params: {
  threadId: string;
  user: CurrentUser;
}): Promise<void> {
  const session = await prisma.conferenceSession.findFirst({
    where: { threadId: params.threadId, status: "active" },
    include: { thread: true },
  });
  if (!session) return;

  if (!(await canStartConference(params.threadId, params.user))) {
    throw new Error("FORBIDDEN");
  }

  const adapter = getConferenceAdapter();
  await adapter.endRoom(session.externalRoomId);

  await prisma.conferenceSession.update({
    where: { id: session.id },
    data: { status: "ended", endedAt: new Date() },
  });

  await prisma.conferenceParticipant.updateMany({
    where: { sessionId: session.id, leftAt: null },
    data: { leftAt: new Date() },
  });

  await sendMessage({
    threadId: params.threadId,
    sender: params.user,
    body: "Call ended.",
    messageType: "system_event",
    metadataJson: { conferenceSessionId: session.id },
  });
}
