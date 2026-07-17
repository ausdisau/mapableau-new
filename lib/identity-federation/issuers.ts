import type { ExternalFederationEntity } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { asJson } from "@/lib/prisma-json";

export async function registerIssuer(input: {
  entityKey: string;
  displayName: string;
  ownerOrganisationId?: string | null;
  metadataEndpoint?: string;
  didDocument?: Record<string, unknown>;
  contactEmail?: string;
  notes?: string;
}): Promise<ExternalFederationEntity> {
  return prisma.externalFederationEntity.upsert({
    where: { entityKey: input.entityKey },
    create: {
      entityKey: input.entityKey,
      displayName: input.displayName,
      kind: "issuer",
      status: "proposed",
      ownerOrganisationId: input.ownerOrganisationId ?? null,
      metadataEndpoint: input.metadataEndpoint ?? null,
      didDocument: asJson(input.didDocument),
      contactEmail: input.contactEmail ?? null,
      notes: input.notes ?? null,
    },
    update: {
      displayName: input.displayName,
      metadataEndpoint: input.metadataEndpoint ?? null,
      didDocument: asJson(input.didDocument),
      contactEmail: input.contactEmail ?? null,
      notes: input.notes ?? null,
    },
  });
}

export async function listIssuers() {
  return prisma.externalFederationEntity.findMany({
    where: { kind: "issuer" },
    orderBy: { displayName: "asc" },
  });
}
