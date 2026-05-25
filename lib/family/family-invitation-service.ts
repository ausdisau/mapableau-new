import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { createNotificationEvent } from "@/lib/access/notification-event-service";
import { notifyUser } from "@/lib/notifications/notification-service";
import { prisma } from "@/lib/prisma";
import type { NomineePermissionScope } from "@prisma/client";

export async function inviteNominee(params: {
  participantId: string;
  nomineeEmail: string;
  nomineeName: string;
  relationship?: string;
  scopes: NomineePermissionScope[];
}) {
  let nomineeUser = await prisma.user.findUnique({
    where: { email: params.nomineeEmail },
  });

  if (!nomineeUser) {
    nomineeUser = await prisma.user.create({
      data: {
        email: params.nomineeEmail,
        name: params.nomineeName,
        primaryRole: "family_member",
        passwordHash: "",
      },
    });
    await prisma.userRoleAssignment.create({
      data: {
        userId: nomineeUser.id,
        role: "family_member",
        isPrimary: true,
      },
    });
  }

  await prisma.nomineeProfile.upsert({
    where: { userId: nomineeUser.id },
    create: {
      userId: nomineeUser.id,
      displayName: params.nomineeName,
      relationship: params.relationship,
    },
    update: {
      displayName: params.nomineeName,
      relationship: params.relationship,
    },
  });

  const link = await prisma.participantNomineeLink.upsert({
    where: {
      participantId_nomineeId: {
        participantId: params.participantId,
        nomineeId: nomineeUser.id,
      },
    },
    create: {
      participantId: params.participantId,
      nomineeId: nomineeUser.id,
      invitedById: params.participantId,
      status: "active",
      acceptedAt: new Date(),
    },
    update: {
      status: "active",
      acceptedAt: new Date(),
      revokedAt: null,
    },
  });

  for (const scope of params.scopes) {
    await prisma.nomineePermission.upsert({
      where: { linkId_scope: { linkId: link.id, scope } },
      create: { linkId: link.id, scope },
      update: { revokedAt: null },
    });
  }

  await createAuditEvent({
    actorUserId: params.participantId,
    action: "family.nominee_invited",
    entityType: "ParticipantNomineeLink",
    entityId: link.id,
    participantId: params.participantId,
    metadata: { scopes: params.scopes },
  });

  await notifyUser(
    nomineeUser.id,
    "profile",
    "You have been invited as a family supporter",
    "A participant has invited you to support them on MapAble."
  );
  await createNotificationEvent({
    userId: nomineeUser.id,
    category: "family",
    eventType: "nominee_invited",
    title: "Family access invitation",
    body: "You have been invited to support a participant.",
    participantId: params.participantId,
    entityType: "ParticipantNomineeLink",
    entityId: link.id,
  });

  return { link, nomineeId: nomineeUser.id };
}

export async function revokeNomineeAccess(params: {
  participantId: string;
  linkId: string;
}) {
  const link = await prisma.participantNomineeLink.findUnique({
    where: { id: params.linkId },
  });
  if (!link || link.participantId !== params.participantId) {
    throw new Error("FORBIDDEN");
  }

  const updated = await prisma.participantNomineeLink.update({
    where: { id: params.linkId },
    data: { status: "revoked", revokedAt: new Date() },
  });

  await createAuditEvent({
    actorUserId: params.participantId,
    action: "family.access_revoked",
    entityType: "ParticipantNomineeLink",
    entityId: params.linkId,
    participantId: params.participantId,
  });

  return updated;
}
