import { prisma } from "@/lib/prisma";

export async function rollbackRelease(input: {
  releaseId: string;
  actorUserId: string;
  reason: string;
}) {
  if (!input.reason || input.reason.trim().length < 20) {
    throw new Error("ROLLBACK_REASON_TOO_SHORT");
  }
  return prisma.$transaction(async (tx) => {
    const rel = await tx.productionRelease.update({
      where: { id: input.releaseId },
      data: {
        status: "rolled_back",
        rolledBackAt: new Date(),
        rollbackReason: input.reason,
      },
    });
    await tx.releaseDeployment.updateMany({
      where: {
        releaseId: input.releaseId,
        status: { in: ["scheduled", "deploying", "succeeded"] },
      },
      data: { status: "rolled_back", rollbackReason: input.reason },
    });
    await tx.auditEvent.create({
      data: {
        actorUserId: input.actorUserId,
        action: "release.rolled_back",
        entityType: "ProductionRelease",
        entityId: input.releaseId,
        metadata: { reason: input.reason },
      },
    });
    return rel;
  });
}
