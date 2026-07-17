import type { ExternalFederationEntity } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { asJson } from "@/lib/prisma-json";

export async function registerVerifier(input: {
  entityKey: string;
  displayName: string;
  ownerOrganisationId?: string | null;
  metadataEndpoint?: string;
  publicKeyJwks?: Record<string, unknown>;
  contactEmail?: string;
  notes?: string;
}): Promise<ExternalFederationEntity> {
  return prisma.externalFederationEntity.upsert({
    where: { entityKey: input.entityKey },
    create: {
      entityKey: input.entityKey,
      displayName: input.displayName,
      kind: "verifier",
      status: "proposed",
      ownerOrganisationId: input.ownerOrganisationId ?? null,
      metadataEndpoint: input.metadataEndpoint ?? null,
      publicKeyJwks: asJson(input.publicKeyJwks),
      contactEmail: input.contactEmail ?? null,
      notes: input.notes ?? null,
    },
    update: {
      displayName: input.displayName,
      ownerOrganisationId: input.ownerOrganisationId ?? null,
      metadataEndpoint: input.metadataEndpoint ?? null,
      publicKeyJwks: asJson(input.publicKeyJwks),
      contactEmail: input.contactEmail ?? null,
      notes: input.notes ?? null,
    },
  });
}

export async function listVerifiers(status?: string) {
  return prisma.externalFederationEntity.findMany({
    where: { kind: "verifier", status: status as never },
    orderBy: { displayName: "asc" },
  });
}
