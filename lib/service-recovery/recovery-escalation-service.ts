import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { prisma } from "@/lib/prisma";
import { createSupportTicket } from "@/lib/support/ticket-service";

import { getRecoveryCase } from "./recovery-case-service";

export async function escalateRecoveryCase(
  caseId: string,
  reason: string,
  actorUserId: string
) {
  const caseRecord = await getRecoveryCase(caseId);
  if (!caseRecord) throw new Error("CASE_NOT_FOUND");

  await prisma.recoveryEscalation.create({
    data: { caseId, reason, escalatedBy: actorUserId },
  });

  const ticket = await createSupportTicket({
    title: `Recovery escalation: ${caseRecord.summary.slice(0, 80)}`,
    description: reason,
    category: "booking_help",
    participantId: caseRecord.participantId,
    bookingId: caseRecord.bookingId ?? undefined,
    createdById: actorUserId,
    requiresIncidentReview: caseRecord.highRisk,
  });

  await prisma.serviceRecoveryCase.update({
    where: { id: caseId },
    data: {
      status: "escalated",
      supportTicketId: ticket.id,
    },
  });

  await createAuditEvent({
    actorUserId,
    action: "service_recovery.escalated",
    entityType: "ServiceRecoveryCase",
    entityId: caseId,
    participantId: caseRecord.participantId,
    metadata: { supportTicketId: ticket.id },
  });

  return { caseRecord, ticket };
}
