import { prisma } from "@/lib/prisma";

export async function rollbackPilotChange(input: {
  changeRequestId: string;
  actorUserId: string;
  reason: string;
}) {
  const change = await prisma.pilotChangeRequest.findUniqueOrThrow({
    where: { id: input.changeRequestId },
  });
  if (change.status !== "applied") {
    throw new Error(`CHANGE_NOT_ROLLBACKABLE:${change.status}`);
  }
  return prisma.pilotChangeRequest.update({
    where: { id: change.id },
    data: {
      status: "rolled_back",
      rolledBackAt: new Date(),
      safeDiffJson: {
        rollbackReason: input.reason,
        rolledBackById: input.actorUserId,
      },
    },
  });
}
