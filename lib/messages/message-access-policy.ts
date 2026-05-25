import type {
  CommunicationThread,
  CommunicationThreadParticipant,
} from "@prisma/client";

import { checkConsent } from "@/lib/consent/consent-service";
import { prisma } from "@/lib/prisma";
import { isAdminRole } from "@/lib/auth/roles";
import type { UserRole } from "@/types/mapable";
import type { ViewerContext } from "@/types/messages";

const ESCALATED_THREAD_TYPES = new Set([
  "complaint",
  "incident_safe_comms",
  "admin_support",
]);

export async function buildViewerContext(params: {
  profileId: string;
  primaryRole: UserRole;
  roles: UserRole[];
}): Promise<ViewerContext> {
  const memberships = await prisma.organisationMember.findMany({
    where: { userId: params.profileId },
    select: { organisationId: true },
  });
  return {
    profileId: params.profileId,
    primaryRole: params.primaryRole,
    organisationIds: memberships.map((m) => m.organisationId),
    isAdmin: params.roles.some((r) => isAdminRole(r)),
  };
}

export async function isThreadParticipant(
  threadId: string,
  profileId: string
): Promise<CommunicationThreadParticipant | null> {
  return prisma.communicationThreadParticipant.findUnique({
    where: { threadId_profileId: { threadId, profileId } },
  });
}

export async function canViewThread(
  thread: CommunicationThread,
  viewer: ViewerContext
): Promise<boolean> {
  if (viewer.isAdmin && ESCALATED_THREAD_TYPES.has(thread.threadType)) {
    return true;
  }

  const participant = await isThreadParticipant(thread.id, viewer.profileId);
  if (participant && !participant.leftAt) return true;

  if (
    thread.threadType === "booking" &&
    thread.bookingId &&
    (viewer.primaryRole === "support_worker" || viewer.primaryRole === "driver")
  ) {
    const booking = await prisma.booking.findUnique({
      where: { id: thread.bookingId },
      select: {
        assignedWorkerId: true,
        assignedDriverId: true,
        assignedOrganisationId: true,
      },
    });
    if (!booking) return false;
    if (booking.assignedWorkerId === viewer.profileId) return true;
    if (booking.assignedDriverId === viewer.profileId) return true;
  }

  if (
    thread.providerId &&
    viewer.organisationIds.includes(thread.providerId) &&
    (viewer.primaryRole === "provider_admin" ||
      viewer.primaryRole === "transport_operator")
  ) {
    return true;
  }

  if (viewer.isAdmin) return true;

  return false;
}

export async function canSendInThread(
  threadId: string,
  viewer: ViewerContext
): Promise<boolean> {
  const participant = await isThreadParticipant(threadId, viewer.profileId);
  if (!participant || participant.leftAt || !participant.canSend) {
    return false;
  }
  if (participant.blocked || participant.muted) return false;

  const blocked = await prisma.blockedChatUser.findFirst({
    where: {
      OR: [
        {
          blockerProfileId: viewer.profileId,
          blockedProfileId: { in: await otherParticipantIds(threadId, viewer.profileId) },
        },
        {
          blockedProfileId: viewer.profileId,
          blockerProfileId: { in: await otherParticipantIds(threadId, viewer.profileId) },
        },
      ],
    },
  });
  if (blocked) return false;

  const thread = await prisma.communicationThread.findUnique({
    where: { id: threadId },
  });
  if (!thread) return false;

  if (!(await canViewThread(thread, viewer))) return false;

  if (thread.participantId && thread.participantId !== viewer.profileId) {
    const hasConsent = await checkConsent({
      subjectUserId: thread.participantId,
      scope: "messages.send",
      grantedToUserId: viewer.profileId,
    });
    if (
      !hasConsent &&
      viewer.primaryRole === "support_coordinator" &&
      !viewer.isAdmin
    ) {
      return false;
    }
  }

  return true;
}

async function otherParticipantIds(threadId: string, excludeId: string) {
  const rows = await prisma.communicationThreadParticipant.findMany({
    where: { threadId, profileId: { not: excludeId }, leftAt: null },
    select: { profileId: true },
  });
  return rows.map((r) => r.profileId);
}

export async function canEscalateThread(
  threadId: string,
  viewer: ViewerContext,
  escalation: "support" | "complaint" | "incident"
): Promise<boolean> {
  const thread = await prisma.communicationThread.findUnique({
    where: { id: threadId },
  });
  if (!thread) return false;
  if (!(await canViewThread(thread, viewer))) return false;
  if (escalation === "incident") {
    return (
      viewer.isAdmin ||
      viewer.primaryRole === "participant"
    );
  }
  return true;
}
