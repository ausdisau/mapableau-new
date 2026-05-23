import { prisma } from "@/lib/prisma";
import { getRoutingProvider } from "@/lib/transport-osm/routing";
import type { LatLng } from "@/lib/transport-osm/routing/types";
import { coordHash } from "@/lib/transport-osm/location-service";

const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

export async function getTravelTimeSeconds(
  origin: LatLng,
  destination: LatLng
): Promise<number> {
  const originHash = coordHash(origin);
  const destHash = coordHash(destination);
  const provider = getRoutingProvider();

  const cached = await prisma.travelTimeMatrixCell.findUnique({
    where: {
      originHash_destHash_routingProvider: {
        originHash,
        destHash,
        routingProvider: provider.name as never,
      },
    },
  });
  if (cached && cached.expiresAt > new Date()) {
    return cached.durationSeconds;
  }

  const matrix = await provider.matrix({
    origins: [origin],
    destinations: [destination],
  });
  const duration = matrix.durationsSeconds[0]?.[0] ?? -1;
  if (duration < 0) throw new Error("MATRIX_FAILED");

  await prisma.travelTimeMatrixCell.upsert({
    where: {
      originHash_destHash_routingProvider: {
        originHash,
        destHash,
        routingProvider: provider.name as never,
      },
    },
    create: {
      originHash,
      destHash,
      durationSeconds: duration,
      routingProvider: provider.name as never,
      expiresAt: new Date(Date.now() + CACHE_TTL_MS),
    },
    update: {
      durationSeconds: duration,
      expiresAt: new Date(Date.now() + CACHE_TTL_MS),
    },
  });

  return duration;
}
