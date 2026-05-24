import { createAuditEvent } from "@/lib/audit/audit-event-service";
import {
  checkCoordinatorParticipantAccess,
} from "@/lib/access/consent-aware-access";
import { prisma } from "@/lib/prisma";
import type { UserRole } from "@/types/mapable";

import { notifyReferralUpdate } from "./support-coordination-service";

export async function createReferral(params: {
  coordinatorId: string;
  participantId: string;
  actorRole: UserRole;
  title: string;
  description?: string;
  providerId?: string;
  organisationId?: string;
}) {
  const access = await checkCoordinatorParticipantAccess({
    coordinatorId: params.coordinatorId,
    participantId: params.participantId,
    actorRole: params.actorRole,
  });
  if (!access.allowed) throw new Error("CONSENT_REQUIRED");

  const referral = await prisma.supportCoordinationReferral.create({
    data: {
      participantId: params.participantId,
      coordinatorId: params.coordinatorId,
      title: params.title,
      description: params.description,
      providerId: params.providerId,
      organisationId: params.organisationId,
      status: "pending_participant_approval",
    },
  });

  await prisma.referralEvent.create({
    data: {
      referralId: referral.id,
      actorUserId: params.coordinatorId,
      eventType: "created",
      notes: "Referral created — awaiting participant approval",
    },
  });

  await createAuditEvent({
    actorUserId: params.coordinatorId,
    action: "support_coordination.referral_created",
    entityType: "SupportCoordinationReferral",
    entityId: referral.id,
    participantId: params.participantId,
  });

  await notifyReferralUpdate(
    params.participantId,
    "New referral needs your approval",
    `Your support coordinator created a referral: ${params.title}. Please review and approve before it is sent to a provider.`
  );

  return referral;
}

export async function updateReferralStatus(params: {
  referralId: string;
  actorUserId: string;
  actorRole: UserRole;
  status: "approved" | "declined" | "sent_to_provider" | "converted_to_booking" | "closed";
  bookingId?: string;
  notes?: string;
}) {
  const referral = await prisma.supportCoordinationReferral.findUnique({
    where: { id: params.referralId },
  });
  if (!referral) throw new Error("NOT_FOUND");

  const isParticipant = params.actorUserId === referral.participantId;
  const isCoordinator =
    params.actorUserId === referral.coordinatorId &&
    params.actorRole === "support_coordinator";

  if (params.status === "approved" || params.status === "declined") {
    if (!isParticipant) throw new Error("PARTICIPANT_APPROVAL_REQUIRED");
  } else if (!isCoordinator && params.actorRole !== "mapable_admin") {
    throw new Error("FORBIDDEN");
  }

  if (
    params.status === "converted_to_booking" &&
    referral.status !== "approved" &&
    referral.status !== "sent_to_provider"
  ) {
    throw new Error("PARTICIPANT_APPROVAL_REQUIRED");
  }

  const updated = await prisma.supportCoordinationReferral.update({
    where: { id: params.referralId },
    data: {
      status: params.status,
      ...(params.status === "approved"
        ? { participantApprovedAt: new Date() }
        : {}),
      ...(params.bookingId ? { bookingId: params.bookingId } : {}),
    },
  });

  await prisma.referralEvent.create({
    data: {
      referralId: referral.id,
      actorUserId: params.actorUserId,
      eventType: `status_${params.status}`,
      notes: params.notes,
    },
  });

  await createAuditEvent({
    actorUserId: params.actorUserId,
    action: "support_coordination.referral_updated",
    entityType: "SupportCoordinationReferral",
    entityId: referral.id,
    participantId: referral.participantId,
    metadata: { status: params.status },
  });

  return updated;
}

export async function listReferralsForCoordinator(coordinatorId: string) {
  return prisma.supportCoordinationReferral.findMany({
    where: { coordinatorId },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
}

export async function compareProvidersForParticipant(params: {
  coordinatorId: string;
  participantId: string;
  actorRole: UserRole;
}) {
  const access = await checkCoordinatorParticipantAccess({
    coordinatorId: params.coordinatorId,
    participantId: params.participantId,
    actorRole: params.actorRole,
  });
  if (!access.allowed) throw new Error("CONSENT_REQUIRED");

  const orgs = await prisma.organisation.findMany({
    where: {
      organisationType: { in: ["care_provider", "support_coordination"] as const },
      verificationStatus: { in: ["verified", "pending_review"] },
    },
    take: 10,
    select: {
      id: true,
      name: true,
      verificationStatus: true,
      serviceRegions: true,
      ndisRegistrationClaimed: true,
    },
  });

  return orgs.map((org) => ({
    ...org,
    comparisonNote:
      "Compare providers with the participant. MapAble does not recommend one provider over another.",
  }));
}
