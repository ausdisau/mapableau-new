import { getPlaceById } from "@/lib/access/map/access-place-service";
import { prisma } from "@/lib/prisma";

import { resolveDestinationFromPlace } from "./resolve";
import type { GaisDestinationResolution } from "./types";

export async function resolveDestinationByPlaceId(
  placeId: string,
): Promise<GaisDestinationResolution | null> {
  const place = await getPlaceById(placeId, true);
  if (!place) return null;
  return resolveDestinationFromPlace(place);
}

/**
 * Resolve by place name (technically honest accessibility-aware geocoding).
 * Matches published AccessPlace records — does not invent venues.
 */
export async function resolveDestinationByQuery(input: {
  query: string;
  limit?: number;
}): Promise<GaisDestinationResolution[]> {
  const q = input.query.trim();
  if (!q) return [];

  const limit = Math.min(input.limit ?? 5, 20);
  const places = await prisma.accessPlace.findMany({
    where: {
      status: "published",
      OR: [
        { name: { contains: q, mode: "insensitive" } },
        { addressText: { contains: q, mode: "insensitive" } },
        { suburb: { contains: q, mode: "insensitive" } },
      ],
    },
    include: { location: true, features: true },
    take: limit,
    orderBy: { updatedAt: "desc" },
  });

  return places.map(resolveDestinationFromPlace);
}
