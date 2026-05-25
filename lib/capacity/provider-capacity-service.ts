import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { prisma } from "@/lib/prisma";
import { requireModuleEnabled } from "@/lib/feature-flags/require-module";

export async function declareProviderCapacity(params: {
  organisationId: string;
  serviceType: string;
  locationRadiusKm?: number;
  availableDates?: unknown;
  accessCapabilities?: unknown;
  workerCount?: number;
  acceptingNewParticipants?: boolean;
  verificationRequiredLevel?: string;
  actorUserId: string;
}) {
  await requireModuleEnabled("waitlist_exchange_enabled");

  const block = await prisma.providerCapacityBlock.create({
    data: {
      organisationId: params.organisationId,
      serviceType: params.serviceType,
      locationRadiusKm: params.locationRadiusKm,
      availableDates: params.availableDates as never,
      accessCapabilities: params.accessCapabilities as never,
      workerCount: params.workerCount,
      acceptingNewParticipants: params.acceptingNewParticipants ?? true,
      verificationRequiredLevel: params.verificationRequiredLevel,
    },
  });

  await createAuditEvent({
    actorUserId: params.actorUserId,
    action: "capacity.declared",
    entityType: "ProviderCapacityBlock",
    entityId: block.id,
    organisationId: params.organisationId,
  });

  return block;
}

export async function listProviderCapacity(organisationId: string) {
  return prisma.providerCapacityBlock.findMany({
    where: { organisationId },
    orderBy: { updatedAt: "desc" },
  });
}
