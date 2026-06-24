import Link from "next/link";

import { AccessPlaceProfile } from "@/components/access/AccessPlaceProfile";
import { AccessPlaceMapTabs } from "@/components/access/AccessPlaceMapTabs";
import { ReportPlaceIssueButton } from "@/components/access/ReportPlaceIssueButton";
import { getPublishedIndoorForPlace } from "@/lib/access-indoor/indoor-service";
import { getAccreditationDisplayForPlace } from "@/lib/access-accreditation/accreditation-assessment-service";
import { getPlaceById } from "@/lib/access-map/access-place-service";
import { listPublishedReviewsForPlace } from "@/lib/access-reviews/access-review-service";
import { publicReviewerDisplayName } from "@/lib/access-reviews/review-access-policy";
import { prisma } from "@/lib/prisma";

export default async function AccessPlacePage({
  params,
}: {
  params: Promise<{ placeId: string }>;
}) {
  const { placeId } = await params;
  const place = await getPlaceById(placeId, true);
  if (!place) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12">
        <p>Place not found.</p>
        <Link href="/access" className="underline">
          Back to map
        </Link>
      </div>
    );
  }

  const [reviewsRaw, accreditationDisplay, indoor] = await Promise.all([
    listPublishedReviewsForPlace(placeId),
    getAccreditationDisplayForPlace(placeId),
    getPublishedIndoorForPlace(placeId),
  ]);

  const users = await prisma.user.findMany({
    where: { id: { in: reviewsRaw.map((r) => r.reviewerProfileId) } },
    select: { id: true, name: true },
  });
  const userMap = new Map(users.map((u) => [u.id, u.name]));

  const reviews = reviewsRaw.map((r) => ({
    id: r.id,
    displayName: publicReviewerDisplayName({
      mode: r.displayNameMode,
      userName: userMap.get(r.reviewerProfileId) ?? "Community member",
    }),
    reviewBody: r.reviewBody,
    label: "Community review — user reported",
    createdAt: r.createdAt.toISOString(),
  }));

  return (
    <div className="mx-auto max-w-3xl space-y-8 px-4 py-8">
      <AccessPlaceProfile
        place={{
          id: place.id,
          name: place.name,
          category: place.category,
          description: place.description,
          addressText: place.addressText,
          suburb: place.suburb,
          stateOrRegion: place.stateOrRegion,
          confidence: place.confidence,
          features: place.features.map((f) => f.type),
          sourceType: place.sourceType,
        }}
        reviews={reviews}
        accreditation={
          accreditationDisplay?.assessment.totalScore != null &&
          accreditationDisplay.assessment.tier
            ? {
                tier: accreditationDisplay.assessment.tier,
                totalScore: accreditationDisplay.assessment.totalScore,
                expired: accreditationDisplay.expired,
              }
            : null
        }
      />

      {place.location ? (
        <>
          <p className="text-sm text-muted-foreground">
            Text alternative: {place.addressText ?? place.name},{" "}
            {place.suburb} {place.stateOrRegion}. Coordinates{" "}
            {place.location.latitude.toFixed(5)},{" "}
            {place.location.longitude.toFixed(5)}.
          </p>
          <AccessPlaceMapTabs
            placeId={placeId}
            placeName={place.name}
            latitude={place.location.latitude}
            longitude={place.location.longitude}
            indoor={indoor}
          />
        </>
      ) : null}

      <ReportPlaceIssueButton placeId={placeId} />
    </div>
  );
}
