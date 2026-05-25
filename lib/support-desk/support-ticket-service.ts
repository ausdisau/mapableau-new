import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { prisma } from "@/lib/prisma";
import { requireModuleEnabled } from "@/lib/feature-flags/require-module";
import { createSupportTicket, updateTicketStatus } from "@/lib/support/ticket-service";
import { recordParticipantTimelineEvent } from "@/lib/timeline/timeline-service";

export { createSupportTicket, updateTicketStatus };

export async function addTicketMessage(params: {
  ticketId: string;
  authorId: string;
  body: string;
  isInternal?: boolean;
}) {
  await requireModuleEnabled("support_desk_enabled");

  const message = await prisma.supportTicketMessage.create({
    data: {
      ticketId: params.ticketId,
      authorId: params.authorId,
      body: params.body,
      isInternal: params.isInternal ?? false,
    },
  });

  await prisma.supportTicketEvent.create({
    data: {
      ticketId: params.ticketId,
      eventType: "message_added",
      actorUserId: params.authorId,
    },
  });

  await createAuditEvent({
    actorUserId: params.authorId,
    action: "support_ticket.message_added",
    entityType: "SupportTicket",
    entityId: params.ticketId,
  });

  return message;
}

export async function assignTicket(
  ticketId: string,
  adminId: string,
  actorUserId: string
) {
  await prisma.supportTicketAssignment.create({
    data: { ticketId, adminId },
  });
  await prisma.supportTicket.update({
    where: { id: ticketId },
    data: { assignedAdminId: adminId, status: "triage" },
  });
  await prisma.supportTicketEvent.create({
    data: {
      ticketId,
      eventType: "assigned",
      actorUserId,
      metadata: { adminId },
    },
  });
  await createAuditEvent({
    actorUserId,
    action: "support_ticket.assigned",
    entityType: "SupportTicket",
    entityId: ticketId,
  });
}

export async function tagTicket(ticketId: string, tag: string) {
  return prisma.supportTicketTag.create({ data: { ticketId, tag } });
}

export async function createTicketWithTimeline(params: Parameters<typeof createSupportTicket>[0]) {
  const ticket = await createSupportTicket(params);
  if (params.participantId) {
    await recordParticipantTimelineEvent({
      participantId: params.participantId,
      eventType: "support_ticket_opened",
      title: "Support request opened",
      summary: params.title,
      sourceType: "SupportTicket",
      sourceId: ticket.id,
    });
  }
  return ticket;
}

export async function escalateTicketToIncident(
  ticketId: string,
  actorUserId: string
) {
  const ticket = await prisma.supportTicket.update({
    where: { id: ticketId },
    data: {
      requiresIncidentReview: true,
      status: "escalated",
    },
  });
  await prisma.supportTicketEvent.create({
    data: {
      ticketId,
      eventType: "escalated_to_incident",
      actorUserId,
    },
  });
  return ticket;
}
