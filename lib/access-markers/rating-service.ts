import { recomputeMarkerAggregate } from "@/lib/access-markers/aggregate-service";
import type { AccessMarkerRatingInput } from "@/lib/access-markers/types";
import { prisma } from "@/lib/prisma";

const RATE_LIMIT_PER_HOUR = 20;

function normalizeRating(value: number | null | undefined): number | null {
  if (value == null || value <= 0) return null;
  return value;
}

export async function upsertMarkerRating(params: {
  placeId: string;
  userId: string;
  input: AccessMarkerRatingInput;
}) {
  const recent = await prisma.accessMarkerRating.count({
    where: {
      userId: params.userId,
      createdAt: { gte: new Date(Date.now() - 60 * 60 * 1000) },
    },
  });
  if (recent >= RATE_LIMIT_PER_HOUR) {
    throw new Error("MARKER_RATING_RATE_LIMIT");
  }

  const place = await prisma.accessPlace.findUnique({
    where: { id: params.placeId },
    select: { id: true },
  });
  if (!place) throw new Error("PLACE_NOT_FOUND");

  const data = {
    overallRating: normalizeRating(params.input.overallRating),
    mobilityRating: normalizeRating(params.input.mobilityRating),
    toiletRating: normalizeRating(params.input.toiletRating),
    parkingDropoffRating: normalizeRating(params.input.parkingDropoffRating),
    sensoryRating: normalizeRating(params.input.sensoryRating),
    communicationRating: normalizeRating(params.input.communicationRating),
    staffServiceRating: normalizeRating(params.input.staffServiceRating),
    visitedInPerson: params.input.visitedInPerson,
    visitedAt: params.input.visitedAt
      ? new Date(params.input.visitedAt)
      : null,
    usedMobilityAid: params.input.usedMobilityAid ?? null,
    mobilityAidType: params.input.mobilityAidType ?? null,
    status: "published" as const,
  };

  const rating = await prisma.accessMarkerRating.upsert({
    where: {
      placeId_userId: { placeId: params.placeId, userId: params.userId },
    },
    create: {
      placeId: params.placeId,
      userId: params.userId,
      ...data,
    },
    update: data,
  });

  const aggregate = await recomputeMarkerAggregate(params.placeId);
  return { rating, aggregate };
}
