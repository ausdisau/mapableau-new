import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { prisma } from "@/lib/prisma";

import { hasNomineeScope } from "./family-permission-policy";

export async function createBookingDraft(params: {
  nomineeId: string;
  participantId: string;
  bookingType: "care" | "transport" | "care_transport";
  requestedStart: Date;
  notes?: string;
}) {
  const canDraft = await hasNomineeScope({
    nomineeId: params.nomineeId,
    participantId: params.participantId,
    scope: "create_booking_draft",
  });
  if (!canDraft) throw new Error("SCOPE_MISSING");

  const link = await prisma.participantNomineeLink.findUnique({
    where: {
      participantId_nomineeId: {
        participantId: params.participantId,
        nomineeId: params.nomineeId,
      },
    },
  });
  if (!link) throw new Error("NO_LINK");

  const booking = await prisma.booking.create({
    data: {
      participantId: params.participantId,
      bookingType: params.bookingType,
      requestedStart: params.requestedStart,
      status: "draft",
      participantNotes: params.notes
        ? `[Draft by family supporter] ${params.notes}`
        : "[Draft by family supporter — participant confirmation required]",
      createdById: params.nomineeId,
    },
  });

  await prisma.nomineeActionLog.create({
    data: {
      linkId: link.id,
      nomineeId: params.nomineeId,
      participantId: params.participantId,
      actionType: "create_booking_draft",
      entityType: "Booking",
      entityId: booking.id,
      details: { requiresParticipantConfirmation: true },
    },
  });

  await prisma.supportedDecisionRecord.create({
    data: {
      participantId: params.participantId,
      supporterId: params.nomineeId,
      linkId: link.id,
      decisionType: "booking_draft",
      summary: `Family supporter drafted a ${params.bookingType} booking`,
      participantConfirmed: false,
    },
  });

  await createAuditEvent({
    actorUserId: params.nomineeId,
    action: "family.booking_draft_created",
    entityType: "Booking",
    entityId: booking.id,
    participantId: params.participantId,
  });

  return {
    booking,
    message:
      "Draft created. The participant should confirm before the booking is sent to a provider.",
  };
}

export async function listSupportedDecisionRecords(params: {
  participantId?: string;
  supporterId?: string;
  limit?: number;
}) {
  return prisma.supportedDecisionRecord.findMany({
    where: {
      ...(params.participantId ? { participantId: params.participantId } : {}),
      ...(params.supporterId ? { supporterId: params.supporterId } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: params.limit ?? 50,
  });
}

export async function listNomineeActionLog(params: {
  nomineeId?: string;
  participantId?: string;
  limit?: number;
}) {
  return prisma.nomineeActionLog.findMany({
    where: {
      ...(params.nomineeId ? { nomineeId: params.nomineeId } : {}),
      ...(params.participantId ? { participantId: params.participantId } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: params.limit ?? 50,
  });
}

export async function logEmergencyProfileAccess(params: {
  nomineeId: string;
  participantId: string;
}) {
  const canView = await hasNomineeScope({
    nomineeId: params.nomineeId,
    participantId: params.participantId,
    scope: "view_emergency_profile",
  });
  if (!canView) throw new Error("SCOPE_MISSING");

  const link = await prisma.participantNomineeLink.findUnique({
    where: {
      participantId_nomineeId: {
        participantId: params.participantId,
        nomineeId: params.nomineeId,
      },
    },
  });
  if (!link) throw new Error("NO_LINK");

  await prisma.nomineeActionLog.create({
    data: {
      linkId: link.id,
      nomineeId: params.nomineeId,
      participantId: params.participantId,
      actionType: "view_emergency_profile",
      entityType: "AccessibilityProfile",
      details: { labelled: "Emergency profile access — logged" },
    },
  });

  await createAuditEvent({
    actorUserId: params.nomineeId,
    action: "family.emergency_profile_accessed",
    entityType: "AccessibilityProfile",
    participantId: params.participantId,
  });

  return prisma.accessibilityProfile.findUnique({
    where: { userId: params.participantId },
  });
}
