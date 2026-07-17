import type { AccessAssetType, AccessSloProfile } from "@prisma/client";

import { prisma } from "@/lib/prisma";

export async function createSloProfile(input: {
  sloKey: string;
  targetValue: number;
  unit: string;
  policyVersion: string;
  assetId?: string | null;
  assetType?: AccessAssetType | null;
}): Promise<AccessSloProfile> {
  return prisma.accessSloProfile.create({
    data: {
      sloKey: input.sloKey,
      targetValue: input.targetValue,
      unit: input.unit,
      policyVersion: input.policyVersion,
      assetId: input.assetId ?? null,
      assetType: input.assetType ?? null,
    },
  });
}
