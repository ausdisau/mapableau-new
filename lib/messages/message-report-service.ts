import { prisma } from "@/lib/prisma";
import { createAuditEvent } from "@/lib/audit/audit-event-service";
import type { CurrentUser } from "@/lib/auth/current-user";
import type { MessageReportReason } from "@/types/messages";
import {
  buildViewerContext,
  canViewThread,
} from "@/lib/messages/message-access-policy";

export async function reportMessage(params: {
  threadId: string;
  reporter: CurrentUser;
  reason: MessageReportReason;
  messageId?: string;
  details?: string;
}) {
  const thread = await prisma.communicationThread.findUnique({
    where: { id: params.threadId },
  });
  if (!thread) throw new Error("THREAD_NOT_FOUND");

  const viewer = await buildViewerContext({
    profileId: params.reporter.id,
    primaryRole: params.reporter.primaryRole,
    roles: params.reporter.roles,
  });
  if (!(await canViewThread(thread, viewer))) throw new Error("FORBIDDEN");

  const report = await prisma.communicationMessageReport.create({
    data: {
      threadId: params.threadId,
      messageId: params.messageId,
      reporterProfileId: params.reporter.id,
      reason: params.reason,
      details: params.details,
    },
  });

  await createAuditEvent({
    actorUserId: params.reporter.id,
    actorRole: params.reporter.primaryRole as never,
    action: "message.reported",
    entityType: "CommunicationMessageReport",
    entityId: report.id,
    metadata: { threadId: params.threadId, reason: params.reason },
  });

  return report;
}

export async function escalateThreadToSupportDesk(params: {
  threadId: string;
  actor: CurrentUser;
  title?: string;
  description?: string;
}) {
  const thread = await prisma.communicationThread.findUnique({
    where: { id: params.threadId },
  });
  if (!thread) throw new Error("THREAD_NOT_FOUND");

  const ticket = await prisma.supportTicket.create({
    data: {
      title: params.title ?? `Escalation from chat: ${thread.title}`,
      description:
        params.description ??
        "This support ticket was created from a message thread escalation.",
      category: "other",
      status: "open",
      priority: "normal",
      createdById: params.actor.id,
      participantId: thread.participantId ?? params.actor.id,
    },
  });

  await prisma.communicationThread.update({
    where: { id: params.threadId },
    data: {
      supportTicketId: ticket.id,
      status: "escalated",
    },
  });

  await prisma.communicationMessage.create({
    data: {
      threadId: params.threadId,
      senderProfileId: params.actor.id,
      messageType: "support_ticket_update",
      body: `Thread escalated to support ticket ${ticket.id}.`,
      status: "sent",
      metadataJson: { supportTicketId: ticket.id },
    },
  });

  return ticket;
}

export async function escalateThreadToComplaint(params: {
  threadId: string;
  actor: CurrentUser;
  description?: string;
}) {
  const thread = await prisma.communicationThread.findUnique({
    where: { id: params.threadId },
  });
  if (!thread) throw new Error("THREAD_NOT_FOUND");

  const updated = await prisma.communicationThread.update({
    where: { id: params.threadId },
    data: {
      threadType: "complaint",
      status: "escalated",
      complaintId: thread.complaintId ?? `complaint-${thread.id}`,
    },
  });

  await prisma.communicationMessage.create({
    data: {
      threadId: params.threadId,
      senderProfileId: params.actor.id,
      messageType: "system_event",
      body: params.description ?? "This thread was escalated as a complaint for review.",
      status: "sent",
    },
  });

  return updated;
}

export async function escalateThreadToIncidentDraft(params: {
  threadId: string;
  actor: CurrentUser;
  description?: string;
}) {
  const thread = await prisma.communicationThread.findUnique({
    where: { id: params.threadId },
  });
  if (!thread) throw new Error("THREAD_NOT_FOUND");

  const incident = await prisma.incidentReport.create({
    data: {
      title: `Safeguarding concern from chat: ${thread.title}`,
      description:
        params.description ??
        "Draft incident created from Communication Centre escalation. Message history preserved on thread.",
      category: "safeguarding_concern",
      severity: "high",
      status: "draft",
      reportedById: params.actor.id,
      participantId: thread.participantId ?? params.actor.id,
    },
  });

  await prisma.communicationThread.update({
    where: { id: params.threadId },
    data: {
      threadType: "incident_safe_comms",
      incidentId: incident.id,
      status: "escalated",
    },
  });

  await prisma.communicationMessage.create({
    data: {
      threadId: params.threadId,
      senderProfileId: params.actor.id,
      messageType: "incident_safety_update",
      body: "Safety escalation recorded. Authorised staff will review this thread.",
      status: "sent",
      metadataJson: { incidentId: incident.id, evidenceThreadId: params.threadId },
    },
  });

  return incident;
}
