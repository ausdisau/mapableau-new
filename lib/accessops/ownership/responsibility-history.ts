import type { AccessAssetResponsibility } from "@prisma/client";

import { prisma } from "@/lib/prisma";

export async function listResponsibilityHistory(
  assetId: string,
): Promise<AccessAssetResponsibility[]> {
  return prisma.accessAssetResponsibility.findMany({
    where: { assetId },
    orderBy: [{ effectiveFrom: "desc" }, { createdAt: "desc" }],
  });
}
