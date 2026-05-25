import type { PanelActor } from "@/lib/access-control/panel-access";
import {
  assertOrganisationAccess,
  assertParticipantSelfAccess,
} from "@/lib/access-control/panel-access";
import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { prisma } from "@/lib/prisma";

export async function listProviderQualityQueue(
  actor: PanelActor,
  organisationId: string
) {
  await assertOrganisationAccess(actor, organisationId, "ProviderQualitySignal");

  return prisma.providerQualitySignal.findMany({
    where: { organisationId },
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
  });
}

export async function createParticipantComplaint(
  actor: PanelActor,
  input: {
    organisationId?: string;
    bookingId?: string;
    category: string;
    description: string;
    safeguarding?: boolean;
  }
) {
  await assertParticipantSelfAccess(actor, actor.id, "Complaint", "create");

  const complaint = await prisma.complaint.create({
    data: {
      participantId: actor.id,
      organisationId: input.organisationId,
      bookingId: input.bookingId,
      category: input.category,
      description: input.description,
      safeguarding: input.safeguarding ?? false,
      status: "open",
      escalated: input.safeguarding ?? false,
    },
  });

  await createAuditEvent({
    actorUserId: actor.id,
    actorRole: actor.primaryRole,
    action: "complaint.created",
    entityType: "Complaint",
    entityId: complaint.id,
    participantId: actor.id,
    metadata: { safeguarding: complaint.safeguarding },
  });

  return complaint;
}

export async function listParticipantComplaints(actor: PanelActor) {
  await assertParticipantSelfAccess(actor, actor.id, "Complaint");
  return prisma.complaint.findMany({
    where: { participantId: actor.id },
    orderBy: { createdAt: "desc" },
  });
}

export async function listParticipantIncidents(actor: PanelActor) {
  await assertParticipantSelfAccess(actor, actor.id, "IncidentReport");
  return prisma.incidentReport.findMany({
    where: { participantId: actor.id },
    orderBy: { createdAt: "desc" },
  });
}
