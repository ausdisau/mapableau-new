import { prisma } from "@/lib/prisma";

export async function geocodeSuburbPostcode(
  suburb?: string,
  postcode?: string
): Promise<{ lat: number; lng: number } | null> {
  if (!suburb && !postcode) return null;

  const row = await prisma.searchableLocation.findFirst({
    where: {
      OR: [
        suburb ? { suburb: { equals: suburb, mode: "insensitive" } } : undefined,
        postcode ? { postcode } : undefined,
      ].filter(Boolean) as never[],
    },
  });

  // Coarse geocoding: use suburb/state lookup table in locationCoords when needed.
  void row;
  return null;
}
