import type { PanelActor } from "@/lib/access-control/panel-access";
import {
  assertOrganisationAccess,
  assertParticipantSelfAccess,
} from "@/lib/access-control/panel-access";
import { prisma } from "@/lib/prisma";

export async function listParticipantQuoteRequests(actor: PanelActor) {
  await assertParticipantSelfAccess(actor, actor.id, "QuoteRequest");
  return prisma.quoteRequest.findMany({
    where: { participantId: actor.id },
    orderBy: { createdAt: "desc" },
    include: {
      organisation: { select: { name: true } },
      responses: true,
      jobPost: { select: { title: true } },
    },
  });
}

export async function listProviderQuoteInbox(
  actor: PanelActor,
  organisationId: string
) {
  await assertOrganisationAccess(actor, organisationId, "QuoteRequest");
  return prisma.quoteRequest.findMany({
    where: { organisationId },
    orderBy: { createdAt: "desc" },
    include: {
      participant: { select: { name: true } },
      responses: { where: { organisationId } },
      jobPost: true,
    },
  });
}

export async function listProviderJobs(
  actor: PanelActor,
  organisationId: string
) {
  await assertOrganisationAccess(actor, organisationId, "JobPost");
  return prisma.jobPost.findMany({
    where: { status: "open" },
    orderBy: { createdAt: "desc" },
    take: 50,
    include: {
      participant: { select: { name: true, id: true } },
      quoteRequests: { where: { organisationId } },
    },
  });
}
