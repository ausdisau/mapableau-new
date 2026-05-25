import type { PanelActor } from "@/lib/access-control/panel-access";
import { assertOrganisationAccess } from "@/lib/access-control/panel-access";
import { prisma } from "@/lib/prisma";

export async function listServiceLogsForReview(
  actor: PanelActor,
  organisationId: string,
  status?: "submitted" | "draft" | "approved"
) {
  await assertOrganisationAccess(actor, organisationId, "ServiceLog");

  return prisma.serviceLog.findMany({
    where: {
      organisationId,
      ...(status ? { status } : {}),
    },
    orderBy: { updatedAt: "desc" },
    include: {
      participant: { select: { name: true, id: true } },
      workerProfile: { select: { displayName: true } },
      progressNotes: { orderBy: { createdAt: "desc" }, take: 3 },
    },
  });
}
