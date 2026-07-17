import type { CivicAccessEntity, CivicAccessEntityType } from "@prisma/client";

import { prisma } from "@/lib/prisma";

export async function registerCivicAccessEntity(input: {
  entityType: CivicAccessEntityType;
  legalName: string;
  displayName: string;
  tenantId?: string | null;
  publicContactReference?: string | null;
  privateOperationalContactReference?: string | null;
}): Promise<CivicAccessEntity> {
  return prisma.civicAccessEntity.create({
    data: {
      entityType: input.entityType,
      legalName: input.legalName,
      displayName: input.displayName,
      tenantId: input.tenantId ?? null,
      publicContactReference: input.publicContactReference ?? null,
      privateOperationalContactReference:
        input.privateOperationalContactReference ?? null,
    },
  });
}

export function unknownCivicEntity(): Pick<
  CivicAccessEntity,
  "id" | "entityType" | "displayName" | "legalName" | "status"
> {
  return {
    id: "unknown",
    entityType: "unknown",
    displayName: "Unknown entity",
    legalName: "Unknown entity",
    status: "active",
  };
}
