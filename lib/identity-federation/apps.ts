import type { ExternalFederationEntity } from "@prisma/client";

import { prisma } from "@/lib/prisma";

/**
 * External apps are third-party apps the participant may connect their
 * MapAble access to. They are subject to the same trust registry and
 * pairwise subject id rules as verifiers.
 */
export async function registerApp(input: {
  entityKey: string;
  displayName: string;
  metadataEndpoint?: string;
  contactEmail?: string;
  notes?: string;
}): Promise<ExternalFederationEntity> {
  return prisma.externalFederationEntity.upsert({
    where: { entityKey: input.entityKey },
    create: {
      entityKey: input.entityKey,
      displayName: input.displayName,
      kind: "app",
      status: "proposed",
      metadataEndpoint: input.metadataEndpoint ?? null,
      contactEmail: input.contactEmail ?? null,
      notes: input.notes ?? null,
    },
    update: {
      displayName: input.displayName,
      metadataEndpoint: input.metadataEndpoint ?? null,
      contactEmail: input.contactEmail ?? null,
      notes: input.notes ?? null,
    },
  });
}

export async function listApps() {
  return prisma.externalFederationEntity.findMany({
    where: { kind: "app" },
    orderBy: { displayName: "asc" },
  });
}
