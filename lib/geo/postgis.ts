import { schedulingConfig } from "@/lib/config/scheduling";
import { prisma } from "@/lib/prisma";

export async function syncLocationGeom(
  table: "ServiceSite" | "ParticipantLocation",
  id: string,
  lat: number,
  lng: number
) {
  if (!schedulingConfig.postgisEnabled) return;
  await prisma.$executeRawUnsafe(
    `UPDATE "${table}" SET "geom" = ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography WHERE "id" = $3`,
    lng,
    lat,
    id
  );
}

export async function findOrganisationsWithinRadiusMeters(params: {
  lat: number;
  lng: number;
  radiusMeters: number;
  limit?: number;
}) {
  const limit = params.limit ?? 20;
  if (!schedulingConfig.postgisEnabled) {
    const sites = await prisma.serviceSite.findMany({
      where: { active: true },
      take: limit,
      include: { organisation: true },
    });
    return sites.map((s) => ({
      organisationId: s.organisationId,
      organisationName: s.organisation.name,
      siteId: s.id,
      distanceMeters: null as number | null,
    }));
  }

  const rows = await prisma.$queryRaw<
    { organisationId: string; organisationName: string; siteId: string; distanceMeters: number }[]
  >`
    SELECT ss."organisationId",
           o."name" AS "organisationName",
           ss."id" AS "siteId",
           ST_Distance(
             ss."geom",
             ST_SetSRID(ST_MakePoint(${params.lng}, ${params.lat}), 4326)::geography
           ) AS "distanceMeters"
    FROM "ServiceSite" ss
    JOIN "Organisation" o ON o."id" = ss."organisationId"
    WHERE ss."active" = true
      AND ss."geom" IS NOT NULL
      AND ST_DWithin(
        ss."geom",
        ST_SetSRID(ST_MakePoint(${params.lng}, ${params.lat}), 4326)::geography,
        ${params.radiusMeters}
      )
    ORDER BY "distanceMeters" ASC
    LIMIT ${limit}
  `;
  return rows;
}
