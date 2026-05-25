import type { PanelActor } from "@/lib/access-control/panel-access";
import {
  assertOrganisationAccess,
  assertParticipantSelfAccess,
} from "@/lib/access-control/panel-access";
import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { prisma } from "@/lib/prisma";

export async function listParticipantInvoices(actor: PanelActor) {
  await assertParticipantSelfAccess(actor, actor.id, "Invoice");
  return prisma.invoice.findMany({
    where: { participantId: actor.id },
    orderBy: { createdAt: "desc" },
    include: { organisation: { select: { name: true } }, lines: true },
  });
}

export async function approveParticipantInvoice(
  actor: PanelActor,
  invoiceId: string
) {
  await assertParticipantSelfAccess(actor, actor.id, "Invoice", invoiceId);

  const invoice = await prisma.invoice.findFirst({
    where: { id: invoiceId, participantId: actor.id },
  });
  if (!invoice) {
    throw new Error("NOT_FOUND");
  }

  const updated = await prisma.invoice.update({
    where: { id: invoiceId },
    data: {
      participantApprovedAt: new Date(),
      status: "approved_for_invoicing",
    },
  });

  await createAuditEvent({
    actorUserId: actor.id,
    actorRole: actor.primaryRole,
    action: "invoice.participant_approved",
    entityType: "Invoice",
    entityId: invoiceId,
    participantId: actor.id,
  });

  return updated;
}

export async function listProviderInvoices(
  actor: PanelActor,
  organisationId: string
) {
  await assertOrganisationAccess(actor, organisationId, "Invoice");
  return prisma.invoice.findMany({
    where: { organisationId },
    orderBy: { createdAt: "desc" },
    include: {
      participant: { select: { name: true, id: true } },
      lines: true,
    },
  });
}
