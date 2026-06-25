import Link from "next/link";

import { AccessAlertBanner } from "@/components/access/AccessAlertBanner";
import { AccessMap } from "@/components/access/AccessMap";
import { AccessPlaceProfile } from "@/components/access/AccessPlaceProfile";
import { AccessReportDraftResume } from "@/components/access-reports/AccessReportDraftResume";
import { ReportPlaceIssueButton } from "@/components/access/ReportPlaceIssueButton";
import { SkipToContent } from "@/components/core/SkipToContent";
import { listActiveAlerts } from "@/lib/access-alerts/access-alert-service";
import { getAccreditationDisplayForPlace } from "@/lib/access-accreditation/accreditation-assessment-service";
import { getPlaceById } from "@/lib/access-map/access-place-service";
import {
  formatDomainScoresForApi,
  getPlaceDomainSummaries,
} from "@/lib/access-reports/access-domain-service";
import { getDraftReportForUser, listReportsFeed } from "@/lib/access-reports/access-report-service";
import { publicReviewerDisplayName } from "@/lib/access-reviews/review-access-policy";
import { getVerificationCounts } from "@/lib/access-verification/verification-service";
import { getCurrentUser } from "@/lib/auth/current-user";
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

  const [domainScoresRaw, reportsRaw, alerts, accreditationDisplay, user] =
    await Promise.all([
      getPlaceDomainSummaries(placeId),
      listReportsFeed(placeId, 5),
      listActiveAlerts({ placeId }),
      getAccreditationDisplayForPlace(placeId),
      getCurrentUser(),
    ]);

  const domainScores = formatDomainScoresForApi(domainScoresRaw);

  const users = await prisma.user.findMany({
    where: { id: { in: reportsRaw.map((r) => r.reviewerProfileId) } },
    select: { id: true, name: true },
  });
  const userMap = new Map(users.map((u) => [u.id, u.name]));

  const reportsFeed = await Promise.all(
    reportsRaw.map(async (r) => ({
      id: r.id,
      displayName: publicReviewerDisplayName({
        mode: r.displayNameMode,
        userName: userMap.get(r.reviewerProfileId) ?? "Community member",
      }),
      reviewBody: r.reviewBody,
      reportType: r.reportType,
      createdAt: r.createdAt.toISOString(),
      verifications: await getVerificationCounts("AccessPlaceReview", r.id),
    }))
  );

  const draft =
    user != null ? await getDraftReportForUser(placeId, user.id) : null;

  return (
    <>
      <SkipToContent />
      <main id="main-content" className="mx-auto max-w-3xl space-y-8 px-4 py-8">
        <nav className="text-sm">
          <Link href="/access" className="underline">
            Back to map
          </Link>
        </nav>

        {draft ? (
          <AccessReportDraftResume
            placeId={placeId}
            draftId={draft.id}
            placeName={place.name}
          />
        ) : null}

        <AccessAlertBanner alerts={alerts} placeId={placeId} />

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
          domainScores={{
            overallScore: domainScores.overallScore,
            confidenceScore: domainScores.confidenceScore,
            lastUpdated: domainScores.lastUpdated,
            domains: domainScores.domains,
          }}
          reportsFeed={reportsFeed}
          claimedByVenue={Boolean(place.venueProfile)}
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
          <section aria-label="Location map">
            <h2 className="text-lg font-semibold">Location</h2>
            <p className="text-sm text-muted-foreground">
              Text alternative: {place.addressText ?? place.name},{" "}
              {place.suburb} {place.stateOrRegion}. Coordinates{" "}
              {place.location.latitude.toFixed(5)},{" "}
              {place.location.longitude.toFixed(5)}.
            </p>
            <div className="mt-2">
              <AccessMap
                places={[
                  {
                    id: place.id,
                    name: place.name,
                    latitude: place.location.latitude,
                    longitude: place.location.longitude,
                  },
                ]}
              />
            </div>
          </section>
        ) : null}

        <ReportPlaceIssueButton placeId={placeId} />
      </main>
    </>
  );
}
