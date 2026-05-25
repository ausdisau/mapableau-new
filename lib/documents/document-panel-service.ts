import type { PanelActor } from "@/lib/access-control/panel-access";
import {
  assertOrganisationAccess,
  assertParticipantSelfAccess,
} from "@/lib/access-control/panel-access";
import { prisma } from "@/lib/prisma";

export async function listParticipantDocuments(actor: PanelActor) {
  await assertParticipantSelfAccess(actor, actor.id, "Document");

  return prisma.document.findMany({
    where: {
      OR: [
        { uploadedById: actor.id },
        { participantId: actor.id },
        { booking: { participantId: actor.id } },
      ],
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function listProviderDocuments(
  actor: PanelActor,
  organisationId: string
) {
  await assertOrganisationAccess(actor, organisationId, "Document");

  return prisma.document.findMany({
    where: { organisationId },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
}
