import { recomputeMarkerAggregate } from "@/lib/access-markers/aggregate-service";
import type { AccessMarkerSummary } from "@/lib/access-markers/types";
import { ACCESS_LABELS } from "@/lib/access-map/copy";
import { prisma } from "@/lib/prisma";

function formatAddress(place: {
  addressText: string | null;
  suburb: string | null;
  stateOrRegion: string | null;
}): string | null {
  const parts = [place.addressText, place.suburb, place.stateOrRegion].filter(
    Boolean
  );
  return parts.length ? parts.join(", ") : place.suburb;
}

export async function getMarkerSummary(
  placeId: string
): Promise<AccessMarkerSummary | null> {
  const place = await prisma.accessPlace.findUnique({
    where: { id: placeId },
    include: {
      location: true,
      features: true,
      markerAggregate: true,
    },
  });
  if (!place) return null;

  let aggregate = place.markerAggregate;
  if (!aggregate) {
    aggregate = await recomputeMarkerAggregate(placeId);
  }

  const [latestComments, activeAlerts] = await Promise.all([
    prisma.accessMarkerComment.findMany({
      where: {
        placeId,
        status: "published",
        commentType: { not: "temporary_alert" },
      },
      orderBy: { createdAt: "desc" },
      take: 2,
      select: {
        id: true,
        commentType: true,
        body: true,
        createdAt: true,
      },
    }),
    prisma.accessMarkerComment.findMany({
      where: {
        placeId,
        status: "published",
        commentType: "temporary_alert",
      },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { id: true, body: true, createdAt: true },
    }),
  ]);

  const accessibleDropoff = place.features.find(
    (f) => f.type === "accessible_dropoff"
  );
  const stepFree = place.features.find((f) => f.type === "step_free_entry");

  return {
    placeId: place.id,
    name: place.name,
    category: place.category,
    addressOrSuburb: formatAddress(place),
    latitude: place.location?.latitude ?? null,
    longitude: place.location?.longitude ?? null,
    overallScore: aggregate.overallScore,
    confidenceScore: aggregate.confidenceScore,
    ratingCount: aggregate.ratingCount,
    commentCount: aggregate.commentCount,
    lastCheckedAt: aggregate.lastCheckedAt?.toISOString() ?? null,
    domainScores: {
      mobility: aggregate.mobilityScore,
      toilet: aggregate.toiletScore,
      parkingDropoff: aggregate.parkingDropoffScore,
      sensory: aggregate.sensoryScore,
      communication: aggregate.communicationScore,
      staffService: aggregate.staffServiceScore,
    },
    latestComments: latestComments.map((c) => ({
      id: c.id,
      commentType: c.commentType,
      body: c.body,
      createdAt: c.createdAt.toISOString(),
    })),
    activeAlerts: activeAlerts.map((a) => ({
      id: a.id,
      body: a.body,
      createdAt: a.createdAt.toISOString(),
    })),
    preferredAccessibleEntrance: stepFree?.notes ?? null,
    accessibleDropoffPoint: accessibleDropoff?.notes ?? null,
  };
}

export function buildMarkerAriaLabel(summary: AccessMarkerSummary): string {
  const score = Math.round(summary.overallScore);
  const confidence = Math.round(summary.confidenceScore);
  const comments = summary.commentCount;
  const alerts = summary.activeAlerts.length;
  const commentPart =
    comments === 1 ? "1 comment" : `${comments} comments`;
  const alertPart =
    alerts === 0
      ? "no active alerts"
      : alerts === 1
        ? "1 active alert"
        : `${alerts} active alerts`;
  return `${summary.name}. Overall accessibility score ${score} percent. Confidence ${confidence} percent. ${commentPart} and ${alertPart}. Press Enter to open details. Community information — ${ACCESS_LABELS.communityReviewed.toLowerCase()}.`;
}
