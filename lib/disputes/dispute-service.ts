import type { DisputeStatus, DisputeType } from "@prisma/client";

import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { phase4Config } from "@/lib/config/phase4";
import { notifyUser } from "@/lib/notifications/notification-service";
import { prisma } from "@/lib/prisma";

export type CreateDisputeInput = {
  participantId: string;
  createdById: string;
  type: DisputeType;
  title: string;
  description: string;
  desiredOutcome?: string;
  bookingId?: string;
  invoiceId?: string;
  timesheetId?: string;
  transportBookingId?: string;
  billingInvoiceId?: string;
  organisationId?: string;
};

async function resolveOrganisationFromLinks(input: CreateDisputeInput) {
  if (input.organisationId) return input.organisationId;
  if (input.bookingId) {
    const b = await prisma.booking.findUnique({
      where: { id: input.bookingId },
      select: { assignedOrganisationId: true, participantId: true },
    });
    if (b && b.participantId !== input.participantId) {
      throw new Error("BOOKING_ACCESS_DENIED");
    }
    return b?.assignedOrganisationId ?? undefined;
  }
  if (input.invoiceId) {
    const inv = await prisma.invoice.findUnique({
      where: { id: input.invoiceId },
      select: { organisationId: true, participantId: true },
    });
    if (inv && inv.participantId !== input.participantId) {
      throw new Error("INVOICE_ACCESS_DENIED");
    }
    return inv?.organisationId ?? undefined;
  }
  if (input.timesheetId) {
    const ts = await prisma.timesheet.findUnique({
      where: { id: input.timesheetId },
      select: { organisationId: true, participantId: true },
    });
    if (ts && ts.participantId !== input.participantId) {
      throw new Error("TIMESHEET_ACCESS_DENIED");
    }
    return ts?.organisationId;
  }
  if (input.transportBookingId) {
    const tb = await prisma.transportBooking.findUnique({
      where: { id: input.transportBookingId },
      select: {
        operatorOrganisationId: true,
        participantId: true,
      },
    });
    if (tb && tb.participantId !== input.participantId) {
      throw new Error("TRANSPORT_ACCESS_DENIED");
    }
    return tb?.operatorOrganisationId ?? undefined;
  }
  return undefined;
}

export async function createDispute(input: CreateDisputeInput) {
  if (!phase4Config.disputesWorkflowEnabled) {
    throw new Error("DISPUTES_DISABLED");
  }

  const organisationId = await resolveOrganisationFromLinks(input);

  const dispute = await prisma.dispute.create({
    data: {
      participantId: input.participantId,
      createdById: input.createdById,
      organisationId,
      bookingId: input.bookingId,
      invoiceId: input.invoiceId,
      timesheetId: input.timesheetId,
      transportBookingId: input.transportBookingId,
      billingInvoiceId: input.billingInvoiceId,
      type: input.type,
      status: "submitted",
      title: input.title,
      description: input.description,
      desiredOutcome: input.desiredOutcome,
    },
  });

  await prisma.disputeEvent.create({
    data: {
      disputeId: dispute.id,
      eventType: "created",
      actorUserId: input.createdById,
      body: "Dispute submitted.",
      visibility: "all",
    },
  });

  await createAuditEvent({
    actorUserId: input.createdById,
    action: "dispute.created",
    entityType: "Dispute",
    entityId: dispute.id,
    participantId: input.participantId,
    organisationId: organisationId ?? undefined,
    metadata: { type: input.type },
  });

  if (organisationId) {
    const orgAdmins = await prisma.organisationMember.findMany({
      where: {
        organisationId,
        role: { in: ["provider_admin", "transport_operator"] },
      },
      select: { userId: true },
    });
    for (const m of orgAdmins) {
      await notifyUser(
        m.userId,
        "support",
        "New dispute needs review",
        `A participant raised a dispute: ${input.title}`
      );
    }
  }

  return dispute;
}

export async function getDisputeById(disputeId: string) {
  return prisma.dispute.findUnique({
    where: { id: disputeId },
    include: {
      events: { orderBy: { createdAt: "asc" } },
      evidence: { orderBy: { createdAt: "asc" } },
      participant: { select: { id: true, name: true } },
      organisation: { select: { id: true, name: true } },
    },
  });
}

export async function listDisputesForUser(params: {
  userId: string;
  organisationIds?: string[];
  isAdmin?: boolean;
}) {
  if (params.isAdmin) {
    return prisma.dispute.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
      include: {
        organisation: { select: { name: true } },
        participant: { select: { name: true } },
      },
    });
  }

  return prisma.dispute.findMany({
    where: {
      OR: [
        { participantId: params.userId },
        { createdById: params.userId },
        ...(params.organisationIds?.length
          ? [{ organisationId: { in: params.organisationIds } }]
          : []),
      ],
    },
    orderBy: { createdAt: "desc" },
    take: 50,
    include: {
      organisation: { select: { name: true } },
      participant: { select: { name: true } },
    },
  });
}

export async function updateDisputeStatus(params: {
  disputeId: string;
  status: DisputeStatus;
  actorUserId: string;
  resolutionSummary?: string;
  assignedAdminId?: string;
}) {
  const before = await prisma.dispute.findUnique({
    where: { id: params.disputeId },
  });
  if (!before) throw new Error("NOT_FOUND");

  const dispute = await prisma.dispute.update({
    where: { id: params.disputeId },
    data: {
      status: params.status,
      resolutionSummary: params.resolutionSummary,
      assignedAdminId: params.assignedAdminId,
      closedAt:
        params.status === "closed" || params.status === "resolved"
          ? new Date()
          : undefined,
    },
  });

  await prisma.disputeEvent.create({
    data: {
      disputeId: dispute.id,
      eventType: "status_changed",
      actorUserId: params.actorUserId,
      body: `Status updated to ${params.status}.`,
      visibility: "all",
    },
  });

  await createAuditEvent({
    actorUserId: params.actorUserId,
    action: "dispute.status_updated",
    entityType: "Dispute",
    entityId: dispute.id,
    participantId: dispute.participantId,
    organisationId: dispute.organisationId ?? undefined,
    metadata: { from: before.status, to: params.status },
  });

  await notifyUser(
    dispute.participantId,
    "support",
    "Dispute update",
    `Your dispute "${dispute.title}" is now: ${params.status.replace(/_/g, " ")}.`
  );

  return dispute;
}

export async function addProviderDisputeResponse(params: {
  disputeId: string;
  responderId: string;
  body: string;
}) {
  const dispute = await prisma.dispute.findUnique({
    where: { id: params.disputeId },
  });
  if (!dispute) throw new Error("NOT_FOUND");

  await prisma.disputeEvent.create({
    data: {
      disputeId: params.disputeId,
      eventType: "provider_response",
      actorUserId: params.responderId,
      body: params.body,
      visibility: "all",
    },
  });

  const updated = await prisma.dispute.update({
    where: { id: params.disputeId },
    data: { status: "under_review" },
  });

  await createAuditEvent({
    actorUserId: params.responderId,
    action: "dispute.provider_responded",
    entityType: "Dispute",
    entityId: params.disputeId,
    participantId: dispute.participantId,
    organisationId: dispute.organisationId ?? undefined,
  });

  await notifyUser(
    dispute.participantId,
    "support",
    "Response to your dispute",
    "The provider has responded to your dispute. Sign in to read the update."
  );

  return updated;
}

export async function requestProviderResponse(
  disputeId: string,
  actorUserId: string
) {
  return updateDisputeStatus({
    disputeId,
    status: "awaiting_provider_response",
    actorUserId,
  });
}
