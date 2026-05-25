import type {
  ServiceRecoveryStatus,
  ServiceRecoveryTrigger,
} from "@prisma/client";

import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { isOrganisationBookingEligible } from "@/lib/providers/provider-org-profile-service";
import { prisma } from "@/lib/prisma";
import { createSupportTicket } from "@/lib/support/ticket-service";

export async function createRecoveryCase(params: {
  trigger: ServiceRecoveryTrigger;
  summary: string;
  createdById: string;
  bookingId?: string | null;
  participantId?: string | null;
  organisationId?: string | null;
}) {
  const recoveryCase = await prisma.serviceRecoveryCase.create({
    data: {
      trigger: params.trigger,
      summary: params.summary,
      createdById: params.createdById,
      bookingId: params.bookingId ?? undefined,
      participantId: params.participantId ?? undefined,
      organisationId: params.organisationId ?? undefined,
      events: {
        create: {
          eventType: "created",
          actorUserId: params.createdById,
          note: params.summary,
        },
      },
    },
  });

  await createAuditEvent({
    actorUserId: params.createdById,
    action: "service_recovery.created",
    entityType: "service_recovery_cases",
    entityId: recoveryCase.id,
    participantId: params.participantId ?? undefined,
    organisationId: params.organisationId ?? undefined,
    metadata: { trigger: params.trigger },
  });

  return recoveryCase;
}

export async function createRecoveryCaseFromDeclinedBooking(
  bookingId: string,
  actorUserId: string,
  note?: string
) {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { assignedOrganisation: true },
  });
  if (!booking) throw new Error("NOT_FOUND");

  return createRecoveryCase({
    trigger: "provider_declined",
    summary:
      note ??
      `Provider ${booking.assignedOrganisation?.name ?? ""} declined booking.`,
    createdById: actorUserId,
    bookingId: booking.id,
    participantId: booking.participantId,
    organisationId: booking.assignedOrganisationId,
  });
}

export async function findBackupOptions(
  recoveryCaseId: string,
  actorUserId: string
) {
  const recoveryCase = await prisma.serviceRecoveryCase.findUnique({
    where: { id: recoveryCaseId },
  });
  if (!recoveryCase) throw new Error("NOT_FOUND");

  const providers = await prisma.organisation.findMany({
    where: {
      id: recoveryCase.organisationId
        ? { not: recoveryCase.organisationId }
        : undefined,
      status: "active",
      verificationStatus: "verified",
      organisationType: { in: ["care_provider", "transport_provider"] },
      organisationProfile: {
        bookingEligibilityStatus: "eligible",
      },
    },
    take: 10,
    orderBy: { name: "asc" },
  });

  await prisma.serviceRecoveryBackupOption.deleteMany({
    where: { recoveryCaseId },
  });

  for (const provider of providers) {
    await prisma.serviceRecoveryBackupOption.create({
      data: {
        recoveryCaseId,
        organisationId: provider.id,
        providerName: provider.name,
        reason: "Verified and booking eligible provider",
        safeToOffer: await isOrganisationBookingEligible(provider.id),
      },
    });
  }

  await prisma.serviceRecoveryCase.update({
    where: { id: recoveryCaseId },
    data: {
      status:
        providers.length > 0
          ? "backup_options_found"
          : ("unresolved" satisfies ServiceRecoveryStatus),
      events: {
        create: {
          eventType: "backup_options_found",
          actorUserId,
          metadata: { count: providers.length },
        },
      },
    },
  });

  return prisma.serviceRecoveryBackupOption.findMany({
    where: { recoveryCaseId },
    orderBy: { createdAt: "asc" },
  });
}

export async function selectBackupOption(
  recoveryCaseId: string,
  backupOptionId: string,
  actorUserId: string
) {
  const option = await prisma.serviceRecoveryBackupOption.findFirst({
    where: { id: backupOptionId, recoveryCaseId },
  });
  if (!option) throw new Error("NOT_FOUND");
  if (!option.safeToOffer) throw new Error("UNSAFE_OPTION");

  await prisma.serviceRecoveryBackupOption.update({
    where: { id: option.id },
    data: { selectedAt: new Date() },
  });

  return prisma.serviceRecoveryCase.update({
    where: { id: recoveryCaseId },
    data: {
      status: "awaiting_provider_confirmation",
      actions: {
        create: {
          actionType: "backup_selected",
          actorUserId,
          note: option.providerName,
        },
      },
      events: {
        create: {
          eventType: "backup_selected",
          actorUserId,
          metadata: { organisationId: option.organisationId },
        },
      },
    },
  });
}

export async function escalateRecoveryCase(
  recoveryCaseId: string,
  actorUserId: string,
  reason: string
) {
  const recoveryCase = await prisma.serviceRecoveryCase.findUnique({
    where: { id: recoveryCaseId },
  });
  if (!recoveryCase) throw new Error("NOT_FOUND");

  const ticket = await createSupportTicket({
    title: "Service recovery escalation",
    description: `${recoveryCase.summary}\n\nEscalation reason: ${reason}`,
    category: "booking_help",
    priority: "high",
    participantId: recoveryCase.participantId ?? undefined,
    organisationId: recoveryCase.organisationId ?? undefined,
    bookingId: recoveryCase.bookingId ?? undefined,
    createdById: actorUserId,
  });

  await prisma.recoveryEscalation.create({
    data: {
      recoveryCaseId,
      supportTicketId: ticket.id,
      reason,
    },
  });

  return prisma.serviceRecoveryCase.update({
    where: { id: recoveryCaseId },
    data: {
      status: "escalated",
      events: {
        create: {
          eventType: "escalated",
          actorUserId,
          note: reason,
        },
      },
    },
  });
}

export async function resolveRecoveryCase(
  recoveryCaseId: string,
  actorUserId: string,
  status: Extract<ServiceRecoveryStatus, "resolved" | "unresolved">,
  note?: string
) {
  return prisma.serviceRecoveryCase.update({
    where: { id: recoveryCaseId },
    data: {
      status,
      events: {
        create: {
          eventType: status,
          actorUserId,
          note,
        },
      },
    },
  });
}

export function shouldRequireParticipantChoice(trigger: ServiceRecoveryTrigger) {
  return [
    "provider_declined",
    "worker_cancelled",
    "driver_late",
    "worker_no_show",
    "service_gap_detected",
  ].includes(trigger);
}
