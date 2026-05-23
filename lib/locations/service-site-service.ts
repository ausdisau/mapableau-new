import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { syncLocationGeom } from "@/lib/geo/postgis";
import { prisma } from "@/lib/prisma";

export async function listServiceSites(organisationId: string) {
  return prisma.serviceSite.findMany({
    where: { organisationId, active: true },
    orderBy: { name: "asc" },
  });
}

export async function createServiceSite(params: {
  organisationId: string;
  name: string;
  addressPublic?: string;
  suburb?: string;
  state?: string;
  postcode?: string;
  lat: number;
  lng: number;
  capabilities?: Record<string, unknown>;
  actorUserId: string;
}) {
  const site = await prisma.serviceSite.create({
    data: {
      organisationId: params.organisationId,
      name: params.name,
      addressPublic: params.addressPublic,
      suburb: params.suburb,
      state: params.state,
      postcode: params.postcode,
      lat: params.lat,
      lng: params.lng,
      capabilities: (params.capabilities ?? {}) as object,
    },
  });

  await syncLocationGeom("ServiceSite", site.id, site.lat, site.lng);

  await createAuditEvent({
    actorUserId: params.actorUserId,
    action: "location.service_site_created",
    entityType: "ServiceSite",
    entityId: site.id,
    organisationId: params.organisationId,
  });

  return site;
}
