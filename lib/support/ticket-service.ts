import type { SupportTicketCategory, SupportTicketPriority } from "@prisma/client";

import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { recordBookingTimelineEvent } from "@/lib/bookings/timeline-service";
import { notifyUser } from "@/lib/notifications/notification-service";
import { prisma } from "@/lib/prisma";

export async function createSupportTicket(params: {
  title: string;
  description: string;
  category: SupportTicketCategory;
  priority?: SupportTicketPriority;
  participantId?: string;
  organisationId?: string;
  bookingId?: string;
  createdById: string;
  requiresIncidentReview?: boolean;
}) {
  const isSafeguarding = params.category === "safeguarding_concern";

  const ticket = await prisma.supportTicket.create({
    data: {
      title: params.title,
      description: params.description,
      category: params.category,
      priority: params.priority ?? (isSafeguarding ? "urgent" : "normal"),
      participantId: params.participantId,
      organisationId: params.organisationId,
      bookingId: params.bookingId,
      createdById: params.createdById,
      requiresIncidentReview:
        params.requiresIncidentReview ?? isSafeguarding,
      status: isSafeguarding ? "escalated" : "open",
    },
  });

  await createAuditEvent({
    actorUserId: params.createdById,
    action: "support_ticket.created",
    entityType: "SupportTicket",
    entityId: ticket.id,
    participantId: params.participantId ?? undefined,
    metadata: {
      category: params.category,
      requiresIncidentReview: ticket.requiresIncidentReview,
    },
  });

  if (params.bookingId) {
    await recordBookingTimelineEvent({
      bookingId: params.bookingId,
      eventType: "support_ticket_created",
      title: "Support ticket created",
      actorUserId: params.createdById,
    });
  }

  const admins = await prisma.user.findMany({
    where: { primaryRole: "mapable_admin" },
    select: { id: true },
  });
  for (const admin of admins) {
    await notifyUser(
      admin.id,
      "safeguarding",
      isSafeguarding ? "Safeguarding concern ticket" : "New support ticket",
      ticket.title
    );
  }

  return ticket;
}

export async function updateTicketStatus(
  ticketId: string,
  status: string,
  actorUserId: string,
  extra?: { assignedAdminId?: string; resolutionSummary?: string }
) {
  const ticket = await prisma.supportTicket.update({
    where: { id: ticketId },
    data: {
      status: status as never,
      ...extra,
      closedAt: status === "closed" || status === "resolved" ? new Date() : undefined,
    },
  });

  await createAuditEvent({
    actorUserId,
    action: "support_ticket.status_changed",
    entityType: "SupportTicket",
    entityId: ticketId,
    participantId: ticket.participantId ?? undefined,
    metadata: { status },
  });

  return ticket;
}

export function isSafeguardingTicket(ticket: {
  category: string;
  requiresIncidentReview: boolean;
}): boolean {
  return (
    ticket.category === "safeguarding_concern" ||
    ticket.requiresIncidentReview
  );
}

export async function getSupportTicketForUser(
  ticketId: string,
  userId: string,
  isAdmin: boolean
) {
  const ticket = await prisma.supportTicket.findUnique({
    where: { id: ticketId },
    include: {
      comments: {
        where: isAdmin ? {} : { isInternal: false },
        orderBy: { createdAt: "asc" },
        include: { author: { select: { id: true, name: true } } },
      },
      createdBy: { select: { name: true } },
      assignedAdmin: { select: { name: true } },
    },
  });
  if (!ticket) return null;
  if (
    !isAdmin &&
    ticket.createdById !== userId &&
    ticket.participantId !== userId
  ) {
    return null;
  }
  return ticket;
}

export async function addTicketMessage(params: {
  ticketId: string;
  authorId: string;
  body: string;
  isInternal?: boolean;
}) {
  const comment = await prisma.supportTicketComment.create({
    data: {
      ticketId: params.ticketId,
      authorId: params.authorId,
      body: params.body.trim().slice(0, 10000),
      isInternal: params.isInternal ?? false,
    },
  });

  await createAuditEvent({
    actorUserId: params.authorId,
    action: "support_ticket.reply",
    entityType: "SupportTicket",
    entityId: params.ticketId,
  });

  return comment;
}

export async function assignSupportTicket(
  ticketId: string,
  assignedAdminId: string,
  actorUserId: string
) {
  return updateTicketStatus(ticketId, "triage", actorUserId, {
    assignedAdminId,
  });
}

export async function escalateSupportTicket(
  ticketId: string,
  reason: string,
  actorUserId: string
) {
  const ticket = await prisma.supportTicket.update({
    where: { id: ticketId },
    data: {
      status: "escalated",
      escalationReason: reason,
      requiresIncidentReview: true,
    },
  });

  await createAuditEvent({
    actorUserId,
    action: "support_ticket.escalated",
    entityType: "SupportTicket",
    entityId: ticketId,
    metadata: { reason },
  });

  return ticket;
}
