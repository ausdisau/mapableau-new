import type { PanelActor } from "@/lib/access-control/panel-access";
import { assertOrganisationAccess } from "@/lib/access-control/panel-access";
import { prisma } from "@/lib/prisma";

export async function listRosterAssignments(
  actor: PanelActor,
  organisationId: string,
  from?: Date,
  to?: Date
) {
  await assertOrganisationAccess(actor, organisationId, "RosterAssignment");

  const start = from ?? new Date();
  const end =
    to ?? new Date(start.getTime() + 14 * 24 * 60 * 60 * 1000);

  return prisma.rosterAssignment.findMany({
    where: {
      organisationId,
      startAt: { gte: start },
      endAt: { lte: end },
    },
    orderBy: { startAt: "asc" },
    include: {
      workerProfile: { select: { displayName: true, id: true } },
      participant: { select: { name: true, id: true } },
    },
  });
}

export async function listCareShiftsAsRoster(
  actor: PanelActor,
  organisationId: string
) {
  await assertOrganisationAccess(actor, organisationId, "CareShift");
  return prisma.careShift.findMany({
    where: { organisationId },
    orderBy: { startAt: "asc" },
    take: 60,
    include: {
      workerProfile: { select: { displayName: true } },
      participant: { select: { name: true } },
    },
  });
}
