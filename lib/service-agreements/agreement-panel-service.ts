import type { PanelActor } from "@/lib/access-control/panel-access";
import {
  assertOrganisationAccess,
  assertParticipantSelfAccess,
} from "@/lib/access-control/panel-access";
import { prisma } from "@/lib/prisma";

export async function listParticipantAgreements(actor: PanelActor) {
  await assertParticipantSelfAccess(actor, actor.id, "ServiceAgreement");
  return prisma.serviceAgreement.findMany({
    where: { participantId: actor.id },
    orderBy: { startDate: "desc" },
    include: { organisation: { select: { name: true } } },
  });
}

export async function listProviderAgreements(
  actor: PanelActor,
  organisationId: string
) {
  await assertOrganisationAccess(actor, organisationId, "ServiceAgreement");
  return prisma.serviceAgreement.findMany({
    where: { organisationId },
    orderBy: { startDate: "desc" },
    include: { participant: { select: { name: true, id: true } } },
  });
}
