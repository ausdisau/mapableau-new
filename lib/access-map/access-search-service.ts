import { prisma } from "@/lib/prisma";
import { buildPlaceWhere, type AccessSearchFilters } from "@/lib/access-map/access-filter-service";
import { rankAccessPlaces } from "@/lib/access-search/access-ranking-service";

export async function searchAccessPlaces(filters: AccessSearchFilters) {
  const where = buildPlaceWhere(filters);

  const places = await prisma.accessPlace.findMany({
    where,
    take: filters.limit,
    include: {
      location: true,
      features: true,
      ratingSummaries: true,
      accreditationAssessments: {
        where: { status: "published" },
        take: 1,
        orderBy: { publishedAt: "desc" },
      },
      _count: {
        select: { reviews: { where: { status: "published" } } },
      },
    },
  });

  const ranked = rankAccessPlaces(places, filters);
  return ranked;
}
