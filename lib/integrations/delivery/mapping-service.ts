import type { IntegrationExternalMapping, Prisma } from "@prisma/client";

import {
  upsertMappingInputSchema,
  type UpsertMappingInput,
} from "@/lib/integrations/contracts/types";
import { prisma } from "@/lib/prisma";

export async function upsertExternalMapping(
  input: UpsertMappingInput,
): Promise<IntegrationExternalMapping> {
  const parsed = upsertMappingInputSchema.parse(input);
  return prisma.integrationExternalMapping.upsert({
    where: {
      organisationId_provider_internalType_internalId: {
        organisationId: parsed.organisationId,
        provider: parsed.provider,
        internalType: parsed.internalType,
        internalId: parsed.internalId,
      },
    },
    create: {
      organisationId: parsed.organisationId,
      provider: parsed.provider,
      internalType: parsed.internalType,
      internalId: parsed.internalId,
      externalId: parsed.externalId,
      externalVersion: parsed.externalVersion,
      syncState: parsed.syncState,
      metadataJson: parsed.metadataJson as Prisma.InputJsonValue | undefined,
    },
    update: {
      externalId: parsed.externalId,
      externalVersion: parsed.externalVersion,
      syncState: parsed.syncState,
      metadataJson: parsed.metadataJson as Prisma.InputJsonValue | undefined,
    },
  });
}

export async function findExternalMapping(params: {
  organisationId: string;
  provider: "deputy" | "xero" | "stripe";
  internalType: string;
  internalId: string;
}): Promise<IntegrationExternalMapping | null> {
  return prisma.integrationExternalMapping.findUnique({
    where: {
      organisationId_provider_internalType_internalId: {
        organisationId: params.organisationId,
        provider: params.provider,
        internalType: params.internalType,
        internalId: params.internalId,
      },
    },
  });
}

export async function findMappingByExternalId(params: {
  organisationId: string;
  provider: "deputy" | "xero" | "stripe";
  internalType: string;
  externalId: string;
}): Promise<IntegrationExternalMapping | null> {
  return prisma.integrationExternalMapping.findUnique({
    where: {
      organisationId_provider_internalType_externalId: {
        organisationId: params.organisationId,
        provider: params.provider,
        internalType: params.internalType,
        externalId: params.externalId,
      },
    },
  });
}

/** Mark independent marketplace workers as not applicable for Deputy sync. */
export async function markMappingNotApplicable(params: {
  organisationId: string;
  provider: "deputy" | "xero" | "stripe";
  internalType: string;
  internalId: string;
  reason: string;
}): Promise<IntegrationExternalMapping> {
  return upsertExternalMapping({
    organisationId: params.organisationId,
    provider: params.provider,
    internalType: params.internalType,
    internalId: params.internalId,
    externalId: `not_applicable:${params.internalId}`,
    syncState: "not_applicable",
    metadataJson: { reason: params.reason },
  });
}
