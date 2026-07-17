import type {
  AccessAssetResponsibility,
  AccessResponsibilityType,
} from "@prisma/client";

import { prisma } from "@/lib/prisma";

export async function assignAssetResponsibility(input: {
  assetId: string;
  entityId: string;
  responsibilityType: AccessResponsibilityType;
  evidenceReference?: string | null;
  verifiedById?: string | null;
}): Promise<AccessAssetResponsibility> {
  return prisma.accessAssetResponsibility.create({
    data: {
      assetId: input.assetId,
      entityId: input.entityId,
      responsibilityType: input.responsibilityType,
      evidenceReference: input.evidenceReference ?? null,
      verifiedAt: input.verifiedById ? new Date() : null,
      verifiedById: input.verifiedById ?? null,
      status: input.verifiedById ? "verified" : "asserted",
    },
  });
}
