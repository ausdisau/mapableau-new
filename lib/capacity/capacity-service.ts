import type { PanelActor } from "@/lib/access-control/panel-access";
import { assertOrganisationAccess } from "@/lib/access-control/panel-access";
import { prisma } from "@/lib/prisma";

export async function getCapacityExchange(
  actor: PanelActor,
  organisationId: string
) {
  await assertOrganisationAccess(actor, organisationId, "CapacityBlock");

  const blocks = await prisma.capacityBlock.findMany({
    where: { organisationId },
    orderBy: { date: "asc" },
    take: 30,
  });

  const waitlist = await prisma.waitlistRequest.findMany({
    where: { organisationId },
    orderBy: { priority: "desc" },
    take: 20,
    include: {
      participant: { select: { name: true, id: true } },
    },
  });

  return { blocks, waitlist };
}

export async function listParticipantWaitlists(actor: PanelActor) {
  const { assertParticipantSelfAccess } = await import(
    "@/lib/access-control/panel-access"
  );
  await assertParticipantSelfAccess(actor, actor.id, "WaitlistRequest");

  return prisma.waitlistRequest.findMany({
    where: { participantId: actor.id },
    orderBy: { createdAt: "desc" },
    include: { organisation: { select: { name: true } } },
  });
}
