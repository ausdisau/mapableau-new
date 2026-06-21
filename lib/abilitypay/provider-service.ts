import { prisma } from "@/lib/prisma";
import type { createProviderSchema } from "@/types/abilitypay";
import type { z } from "zod";

import { logAbilityPayEvent } from "./audit";

export async function listProviders() {
  return prisma.abilityPayProvider.findMany({
    where: { isActive: true },
    include: { credentials: true, organisation: { select: { id: true, name: true } } },
    orderBy: { legalName: "asc" },
  });
}

export async function getProviderById(providerId: string) {
  return prisma.abilityPayProvider.findUnique({
    where: { id: providerId },
    include: { credentials: true, organisation: true },
  });
}

export async function createProvider(
  userId: string,
  input: z.infer<typeof createProviderSchema>
) {
  const provider = await prisma.abilityPayProvider.create({
    data: {
      legalName: input.legalName,
      abn: input.abn,
      contactEmail: input.contactEmail,
      contactPhone: input.contactPhone,
      organisationId: input.organisationId,
    },
    include: { credentials: true },
  });

  await logAbilityPayEvent({
    action: "abilitypay.provider.created",
    entityType: "AbilityPayProvider",
    entityId: provider.id,
    actorUserId: userId,
    organisationId: provider.organisationId,
    metadata: { legalName: provider.legalName },
  });

  return provider;
}
