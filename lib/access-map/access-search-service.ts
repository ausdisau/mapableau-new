import { prisma } from "@/lib/prisma";
import { buildPlaceWhere, type AccessSearchFilters } from "@/lib/access-map/access-filter-service";
import { countActiveAlertsForPlace } from "@/lib/access-alerts/access-alert-service";
import {
  formatDomainScoresForApi,
  getPlaceDomainSummaries,
  computeOverallScore,
} from "@/lib/access-reports/access-domain-service";
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
      domainSummaries: true,
      venueProfile: { select: { id: true } },
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

  const withScores = await Promise.all(
    ranked.map(async (r) => {
      const summaries = r.place.domainSummaries ?? [];
      const domainScores =
        summaries.length > 0
          ? (() => {
              const domains = summaries.map((d) => ({
                domain: d.domain as import("@prisma/client").AccessDomain,
                score: d.score,
                confidenceScore: d.confidenceScore,
                sampleCount: d.sampleCount,
                lastUpdated: d.lastUpdated.toISOString(),
              }));
              const lastUpdated = domains
                .map((d) => d.lastUpdated)
                .sort()
                .pop() ?? null;
              const confidenceValues = domains
                .map((d) => d.confidenceScore)
                .filter((c): c is number => c != null);
              return formatDomainScoresForApi({
                overallScore: computeOverallScore(domains),
                confidenceScore:
                  confidenceValues.length > 0
                    ? confidenceValues.reduce((a, b) => a + b, 0) /
                      confidenceValues.length
                    : null,
                domains,
                lastUpdated,
              });
            })()
          : formatDomainScoresForApi(
              await getPlaceDomainSummaries(r.place.id)
            );
      const activeAlertCount = await countActiveAlertsForPlace(r.place.id);
      return { ...r, domainScores, activeAlertCount };
    })
  );

  return withScores;
}
