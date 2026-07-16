import type { PrismaClient } from "@prisma/client";

type PrismaLike = Pick<PrismaClient, "ndisBillableServiceItem">;

/** Find an existing billable item by organisation + sourceKey (idempotency). */
export async function findDuplicateBySourceKey(
  prismaClient: PrismaLike,
  organisationId: string,
  sourceKey: string
) {
  return prismaClient.ndisBillableServiceItem.findUnique({
    where: {
      organisationId_sourceKey: {
        organisationId,
        sourceKey,
      },
    },
  });
}
