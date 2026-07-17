import type { AccessDataSource, AccessDataSourceType } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { asJson } from "@/lib/prisma-json";

import type { JsonObject } from "../types";

export async function registerAccessDataSource(input: {
  sourceKey: string;
  displayName: string;
  ownerEntityId: string;
  sourceType: AccessDataSourceType;
  protocol: string;
  dataLicence: string;
  allowedUses: JsonObject;
  attributionText: string;
  expectedUpdateInterval: number;
  staleAfterSeconds: number;
  schemaProfile: string;
}): Promise<AccessDataSource> {
  const allowedUses = asJson(input.allowedUses);
  if (!allowedUses) throw new Error("ALLOWED_USES_REQUIRED");
  return prisma.accessDataSource.create({
    data: {
      sourceKey: input.sourceKey,
      displayName: input.displayName,
      ownerEntityId: input.ownerEntityId,
      sourceType: input.sourceType,
      protocol: input.protocol,
      dataLicence: input.dataLicence,
      allowedUses,
      attributionText: input.attributionText,
      expectedUpdateInterval: input.expectedUpdateInterval,
      staleAfterSeconds: input.staleAfterSeconds,
      schemaProfile: input.schemaProfile,
      productionActivated: false,
    },
  });
}
