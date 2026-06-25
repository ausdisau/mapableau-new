import Link from "next/link";

import { CommunityReportsFeed } from "@/components/access/CommunityReportsFeed";
import { SkipToContent } from "@/components/core/SkipToContent";
import { getPlaceById } from "@/lib/access-map/access-place-service";
import { listReportsFeed } from "@/lib/access-reports/access-report-service";
import { publicReviewerDisplayName } from "@/lib/access-reviews/review-access-policy";
import { getVerificationCounts } from "@/lib/access-verification/verification-service";
import { prisma } from "@/lib/prisma";

export default async function PlaceReportsPage({
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
      </div>
    );
  }

  const reportsRaw = await listReportsFeed(placeId, 50);
  const users = await prisma.user.findMany({
    where: { id: { in: reportsRaw.map((r) => r.reviewerProfileId) } },
    select: { id: true, name: true },
  });
  const userMap = new Map(users.map((u) => [u.id, u.name]));

  const reports = await Promise.all(
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

  return (
    <>
      <SkipToContent />
      <main id="main-content" className="mx-auto max-w-3xl space-y-6 px-4 py-8">
        <nav className="text-sm">
          <Link href={`/access/places/${placeId}`} className="underline">
            Back to {place.name}
          </Link>
        </nav>
        <h1 className="text-2xl font-bold">Community reports — {place.name}</h1>
        <CommunityReportsFeed placeId={placeId} reports={reports} />
      </main>
    </>
  );
}
