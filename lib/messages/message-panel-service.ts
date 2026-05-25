import type { PanelActor } from "@/lib/access-control/panel-access";
import {
  assertOrganisationAccess,
  assertParticipantSelfAccess,
} from "@/lib/access-control/panel-access";
import { prisma } from "@/lib/prisma";

const SAFE_CONVERSATION_TYPES = [
  "participant_provider",
  "booking_thread",
  "participant_support_coordinator",
] as const;

export async function listParticipantMessages(actor: PanelActor) {
  await assertParticipantSelfAccess(actor, actor.id, "Message");

  return prisma.conversation.findMany({
    where: {
      type: { in: [...SAFE_CONVERSATION_TYPES] },
      participants: { some: { userId: actor.id } },
    },
    orderBy: { updatedAt: "desc" },
    include: {
      messages: { orderBy: { createdAt: "desc" }, take: 1 },
      participants: {
        include: { user: { select: { id: true, name: true } } },
      },
    },
  });
}

export async function listProviderMessages(
  actor: PanelActor,
  organisationId: string
) {
  await assertOrganisationAccess(actor, organisationId, "Message");

  return prisma.conversation.findMany({
    where: {
      type: { in: ["participant_provider", "booking_thread", "organisation_admin"] },
      organisationId,
    },
    orderBy: { updatedAt: "desc" },
    take: 50,
    include: {
      messages: { orderBy: { createdAt: "desc" }, take: 1 },
    },
  });
}
