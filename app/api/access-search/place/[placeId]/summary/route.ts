import { jsonError, jsonOk } from "@/lib/api/response";
import { stripReviewPii } from "@/lib/ai/privacy";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ placeId: string }> };

/** Place summary for chat result cards and map drawers. */
export async function GET(_req: Request, { params }: Params) {
  const { placeId } = await params;

  const place = await prisma.accessPlace.findFirst({
    where: { id: placeId, status: "published" },
    include: {
      location: true,
      features: true,
      ratingSummaries: true,
      accreditationAssessments: {
        where: { status: "published" },
        take: 1,
        orderBy: { publishedAt: "desc" },
      },
      reviews: {
        where: { status: "published" },
        orderBy: { createdAt: "desc" },
        take: 1,
        include: { photos: { take: 1, select: { id: true } } },
      },
      alerts: {
        where: {
          status: "active",
          OR: [{ endsAt: null }, { endsAt: { gt: new Date() } }],
        },
        take: 10,
        orderBy: { startsAt: "desc" },
      },
      _count: {
        select: { reviews: { where: { status: "published" } } },
      },
    },
  });

  if (!place) return jsonError("Place not found", 404);

  const latest = place.reviews[0];
  const overall =
    place.ratingSummaries.length > 0
      ? place.ratingSummaries.reduce((a, s) => a + (s.avgScore ?? 0), 0) /
        place.ratingSummaries.length
      : 0;

  return jsonOk({
    placeId: place.id,
    name: place.name,
    category: place.category,
    address: [place.addressText, place.suburb, place.stateOrRegion]
      .filter(Boolean)
      .join(", "),
    latitude: place.location?.latitude,
    longitude: place.location?.longitude,
    confidence: place.confidence,
    features: place.features.map((f) => f.type),
    accessSummary: {
      overallScore: Math.round(overall * 10) / 10,
      lastVerifiedAt: (
        latest?.visitDate ??
        latest?.createdAt ??
        place.accreditationAssessments[0]?.publishedAt ??
        null
      )?.toISOString(),
      ratingSummaries: place.ratingSummaries,
      accreditationTier: place.accreditationAssessments[0]?.tier ?? null,
    },
    evidence: {
      latestComment: latest
        ? stripReviewPii(latest.reviewBody).slice(0, 400)
        : undefined,
      activeAlerts: place.alerts.map(
        (a) => `${a.severity}: ${a.title}${a.body ? ` — ${a.body}` : ""}`,
      ),
      verifiedByCommunityCount: place._count.reviews,
      photosAvailable: Boolean(latest?.photos.length),
    },
    actions: {
      openMarkerUrl: `/access?placeId=${place.id}`,
      placePageUrl: `/access/places/${place.id}`,
      planTransportUrl: `/dashboard/transport/new?placeId=${place.id}`,
      addReportUrl: `/access/review/${place.id}`,
    },
  });
}
