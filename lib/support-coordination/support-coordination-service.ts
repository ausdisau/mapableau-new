import { createAuditEvent } from "@/lib/audit/audit-event-service";
import {
  checkCoordinatorParticipantAccess,
  logConsentGatedAccess,
} from "@/lib/access/consent-aware-access";
import { createNotificationEvent } from "@/lib/access/notification-event-service";
import { notifyUser } from "@/lib/notifications/notification-service";
import { prisma } from "@/lib/prisma";
import type { UserRole } from "@/types/mapable";

export async function getCoordinatorCaseload(coordinatorId: string) {
  const relationships = await prisma.supportCoordinatorRelationship.findMany({
    where: { coordinatorId },
    orderBy: { createdAt: "desc" },
  });

  const profiles = await Promise.all(
    relationships.map(async (rel) => {
      const profile = await prisma.participantProfile.findUnique({
        where: { userId: rel.participantId },
        select: { displayName: true, preferredName: true, homeSuburb: true },
      });
      const consentActive = rel.status === "active";
      return {
        participantId: rel.participantId,
        relationshipId: rel.id,
        status: rel.status,
        consentActive,
        displayName:
          profile?.preferredName ?? profile?.displayName ?? "Participant",
        homeSuburb: profile?.homeSuburb,
        scopes: rel.scopesJson,
      };
    })
  );

  return profiles;
}

export async function getParticipantOverviewForCoordinator(params: {
  coordinatorId: string;
  participantId: string;
  actorRole: UserRole;
}) {
  const access = await checkCoordinatorParticipantAccess({
    coordinatorId: params.coordinatorId,
    participantId: params.participantId,
    actorRole: params.actorRole,
  });

  await logConsentGatedAccess({
    actorUserId: params.coordinatorId,
    actorRole: params.actorRole,
    participantId: params.participantId,
    resourceType: "ParticipantOverview",
    action: "view",
    accessResult: access,
  });

  if (!access.allowed) {
    return {
      consentActive: false,
      message:
        "This participant has not granted consent. You can request access through the Consent Centre.",
      data: null,
    };
  }

  const [profile, goals, reminders, referrals, notes] = await Promise.all([
    prisma.participantProfile.findUnique({
      where: { userId: params.participantId },
    }),
    prisma.goalProgressUpdate.findMany({
      where: { participantId: params.participantId },
      orderBy: { updatedAt: "desc" },
      take: 10,
    }),
    prisma.planReviewReminder.findMany({
      where: { participantId: params.participantId },
      orderBy: { reviewDate: "asc" },
      take: 5,
    }),
    prisma.supportCoordinationReferral.findMany({
      where: {
        participantId: params.participantId,
        coordinatorId: params.coordinatorId,
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
    prisma.supportCoordinationNote.findMany({
      where: {
        participantId: params.participantId,
        coordinatorId: params.coordinatorId,
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
  ]);

  const bookingCount = await prisma.booking.count({
    where: { participantId: params.participantId, status: { not: "draft" } },
  });

  return {
    consentActive: true,
    message: null,
    data: {
      profile,
      goals,
      reminders,
      referrals,
      notes,
      bookingCount,
    },
  };
}

export async function createSupportCoordinationNote(params: {
  coordinatorId: string;
  participantId: string;
  actorRole: UserRole;
  content: string;
  relationshipId?: string;
}) {
  const access = await checkCoordinatorParticipantAccess({
    coordinatorId: params.coordinatorId,
    participantId: params.participantId,
    actorRole: params.actorRole,
  });
  if (!access.allowed) throw new Error("CONSENT_REQUIRED");

  const note = await prisma.supportCoordinationNote.create({
    data: {
      participantId: params.participantId,
      coordinatorId: params.coordinatorId,
      relationshipId: params.relationshipId,
      content: params.content,
    },
  });

  await createAuditEvent({
    actorUserId: params.coordinatorId,
    action: "support_coordination.note_created",
    entityType: "SupportCoordinationNote",
    entityId: note.id,
    participantId: params.participantId,
  });

  return note;
}

export async function getCoordinatorProfile(userId: string) {
  return prisma.supportCoordinatorProfile.findUnique({ where: { userId } });
}

export async function upsertCoordinatorProfile(params: {
  userId: string;
  displayName: string;
  bio?: string;
  regions?: string[];
  organisationId?: string;
}) {
  return prisma.supportCoordinatorProfile.upsert({
    where: { userId: params.userId },
    create: {
      userId: params.userId,
      displayName: params.displayName,
      bio: params.bio,
      regions: params.regions ?? [],
      organisationId: params.organisationId,
    },
    update: {
      displayName: params.displayName,
      bio: params.bio,
      regions: params.regions ?? [],
      organisationId: params.organisationId,
    },
  });
}

export async function notifyReferralUpdate(
  participantId: string,
  title: string,
  body: string
) {
  await notifyUser(participantId, "provider", title, body);
  await createNotificationEvent({
    userId: participantId,
    category: "referral",
    eventType: "referral_updated",
    title,
    body,
    participantId,
  });
}
