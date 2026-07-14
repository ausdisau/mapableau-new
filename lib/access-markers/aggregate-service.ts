import {
  computeConfidenceScore,
  computeDomainScoresFromRatings,
} from "@/lib/access-markers/scoring";
import { prisma } from "@/lib/prisma";

export async function recomputeMarkerAggregate(placeId: string) {
  const [ratings, publishedComments, photoCommentCount, verifies, disputes] =
    await Promise.all([
      prisma.accessMarkerRating.findMany({
        where: { placeId, status: "published" },
      }),
      prisma.accessMarkerComment.count({
        where: { placeId, status: "published" },
      }),
      prisma.accessMarkerComment.count({
        where: {
          placeId,
          status: "published",
          evidencePhotoIds: { isEmpty: false },
        },
      }),
      prisma.accessMarkerVerification.count({
        where: { placeId, action: "confirm_accurate" },
      }),
      prisma.accessMarkerVerification.count({
        where: { placeId, action: "dispute" },
      }),
    ]);

  const domainScores = computeDomainScoresFromRatings(
    ratings.map((r) => ({
      overallRating: r.overallRating,
      mobilityRating: r.mobilityRating,
      toiletRating: r.toiletRating,
      parkingDropoffRating: r.parkingDropoffRating,
      sensoryRating: r.sensoryRating,
      communicationRating: r.communicationRating,
      staffServiceRating: r.staffServiceRating,
      visitedInPerson: r.visitedInPerson,
    }))
  );

  const lastRatedAt = ratings.reduce<Date | null>((latest, r) => {
    if (!latest || r.updatedAt > latest) return r.updatedAt;
    return latest;
  }, null);

  const lastVerified = await prisma.accessMarkerVerification.findFirst({
    where: { placeId, action: "confirm_accurate" },
    orderBy: { createdAt: "desc" },
    select: { createdAt: true },
  });

  const lastCheckedCandidates = [
    lastRatedAt,
    lastVerified?.createdAt ?? null,
  ].filter((d): d is Date => d != null);
  const lastCheckedAt =
    lastCheckedCandidates.length > 0
      ? new Date(Math.max(...lastCheckedCandidates.map((d) => d.getTime())))
      : null;

  const confidenceScore = computeConfidenceScore({
    ratingCount: ratings.length,
    verifiedCount: verifies,
    disputedCount: disputes,
    photoCount: photoCommentCount,
    lastRatedAt,
  });

  return prisma.accessMarkerAggregateScore.upsert({
    where: { placeId },
    create: {
      placeId,
      ...domainScores,
      confidenceScore,
      ratingCount: ratings.length,
      commentCount: publishedComments,
      verifiedCount: verifies,
      disputedCount: disputes,
      lastRatedAt,
      lastVerifiedAt: lastVerified?.createdAt ?? null,
      lastCheckedAt,
    },
    update: {
      ...domainScores,
      confidenceScore,
      ratingCount: ratings.length,
      commentCount: publishedComments,
      verifiedCount: verifies,
      disputedCount: disputes,
      lastRatedAt,
      lastVerifiedAt: lastVerified?.createdAt ?? null,
      lastCheckedAt,
    },
  });
}
