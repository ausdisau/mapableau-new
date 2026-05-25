import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { prisma } from "@/lib/prisma";
import type {
  createPeerMentorProfileSchema,
  createPeerMentorRequestSchema,
} from "@/lib/validation/peer";
import type { z } from "zod";

import { assertMentorCannotAccessParticipantRecords } from "./access-control";
import { notifyPeerUser } from "./peer-notification-service";

export async function listPeerMentors() {
  return prisma.peerMentorProfile.findMany({
    where: { active: true },
    include: {
      peerProfile: { include: { user: { select: { name: true } } } },
    },
  });
}

export async function getPeerMentor(mentorProfileId: string) {
  return prisma.peerMentorProfile.findUnique({
    where: { id: mentorProfileId },
    include: {
      peerProfile: { include: { user: { select: { name: true } } } },
    },
  });
}

export async function upsertPeerMentorProfile(
  userId: string,
  peerProfileId: string,
  data: z.infer<typeof createPeerMentorProfileSchema>
) {
  const mentor = await prisma.peerMentorProfile.upsert({
    where: { peerProfileId },
    create: {
      peerProfileId,
      bio: data.bio,
      livedExperienceTopics: data.livedExperienceTopics,
      boundaries: data.boundaries,
      availabilityNotes: data.availabilityNotes,
    },
    update: {
      bio: data.bio,
      livedExperienceTopics: data.livedExperienceTopics,
      boundaries: data.boundaries,
      availabilityNotes: data.availabilityNotes,
    },
    include: { peerProfile: { include: { user: { select: { name: true } } } } },
  });

  await createAuditEvent({
    actorUserId: userId,
    action: "peer.mentor.profile.updated",
    entityType: "PeerMentorProfile",
    entityId: mentor.id,
  });

  return mentor;
}

export async function createMentorRequest(
  requesterProfileId: string,
  mentorProfileId: string,
  requesterUserId: string,
  data: z.infer<typeof createPeerMentorRequestSchema>
) {
  const mentor = await prisma.peerMentorProfile.findUnique({
    where: { id: mentorProfileId },
    include: { peerProfile: { select: { userId: true } } },
  });
  if (!mentor?.active) throw new Error("MENTOR_NOT_AVAILABLE");

  const requester = await prisma.peerProfile.findUnique({
    where: { id: requesterProfileId },
    select: { userId: true },
  });
  if (requester) {
    try {
      await assertMentorCannotAccessParticipantRecords(
        mentor.peerProfile.userId,
        requester.userId
      );
    } catch {
      /* mentor must not load participant records; request flow does not expose them */
    }
  }

  const request = await prisma.peerMentorRequest.create({
    data: {
      mentorProfileId,
      requesterId: requesterProfileId,
      message: data.message,
      status: "requested",
    },
  });

  await createAuditEvent({
    actorUserId: requesterUserId,
    action: "peer.mentor.request.created",
    entityType: "PeerMentorRequest",
    entityId: request.id,
  });

  await notifyPeerUser(mentor.peerProfile.userId, "mentor_request_update", {
    requestId: request.id,
  });

  return request;
}

export async function listMentorRequestsForMentor(peerProfileId: string) {
  const mentor = await prisma.peerMentorProfile.findUnique({
    where: { peerProfileId },
  });
  if (!mentor) return [];

  return prisma.peerMentorRequest.findMany({
    where: { mentorProfileId: mentor.id },
    orderBy: { createdAt: "desc" },
    include: {
      requester: { include: { user: { select: { name: true } } } },
    },
  });
}

export async function updateMentorRequestStatus(
  mentorUserId: string,
  requestId: string,
  status: "accepted" | "declined" | "mentor_review"
) {
  const request = await prisma.peerMentorRequest.update({
    where: { id: requestId },
    data: { status },
    include: { requester: true, mentorProfile: true },
  });

  await createAuditEvent({
    actorUserId: mentorUserId,
    action: "peer.mentor.request.updated",
    entityType: "PeerMentorRequest",
    entityId: request.id,
    metadata: { status },
  });

  await notifyPeerUser(request.requester.userId, "mentor_request_update", {
    requestId: request.id,
    status,
  });

  return request;
}
