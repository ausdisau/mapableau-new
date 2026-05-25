import { prisma } from "@/lib/prisma";

const PROXIMITY_KM = 0.05;

function haversineKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export async function findDuplicatePlaceCandidates(params: {
  name: string;
  latitude?: number;
  longitude?: number;
  sourceReference?: string;
}) {
  const conflicts: { placeId: string; reason: string }[] = [];

  if (params.sourceReference) {
    const bySource = await prisma.accessPlace.findFirst({
      where: { sourceReference: params.sourceReference },
      select: { id: true, name: true },
    });
    if (bySource) {
      conflicts.push({
        placeId: bySource.id,
        reason: `Same source reference as "${bySource.name}"`,
      });
    }
  }

  const nameMatches = await prisma.accessPlace.findMany({
    where: {
      name: { equals: params.name, mode: "insensitive" },
      status: { not: "archived" },
    },
    include: { location: true },
    take: 10,
  });

  for (const match of nameMatches) {
    if (!params.latitude || !params.longitude || !match.location) {
      conflicts.push({ placeId: match.id, reason: "Same name" });
      continue;
    }
    const dist = haversineKm(
      params.latitude,
      params.longitude,
      match.location.latitude,
      match.location.longitude
    );
    if (dist <= PROXIMITY_KM) {
      conflicts.push({
        placeId: match.id,
        reason: `Name match within ${PROXIMITY_KM}km`,
      });
    }
  }

  return conflicts;
}
