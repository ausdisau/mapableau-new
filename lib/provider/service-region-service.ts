import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { prisma } from "@/lib/prisma";

export async function listServiceRegions(organisationId: string) {
  return prisma.providerServiceRegion.findMany({
    where: { organisationId },
    orderBy: { label: "asc" },
  });
}

export async function upsertServiceRegion(input: {
  organisationId: string;
  label: string;
  postcodes?: string[];
  suburbs?: string[];
  geoJson?: unknown;
  actorUserId: string;
  actorRole: string;
}) {
  const region = await prisma.providerServiceRegion.create({
    data: {
      organisationId: input.organisationId,
      label: input.label,
      postcodes: input.postcodes ?? [],
      suburbs: input.suburbs ?? [],
      geoJson: input.geoJson ?? undefined,
    },
  });
  await createAuditEvent({
    actorUserId: input.actorUserId,
    actorRole: input.actorRole as never,
    action: "organisation.updated",
    entityType: "provider_service_region",
    entityId: region.id,
    organisationId: input.organisationId,
  });
  return region;
}

export function regionCoversPostcode(
  region: { postcodes: string[] },
  postcode: string
): boolean {
  if (region.postcodes.length === 0) return true;
  return region.postcodes.includes(postcode);
}
