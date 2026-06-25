import Link from "next/link";

import { CommunityReportsFeed } from "@/components/access/CommunityReportsFeed";
import { getRecentCommunityFeed } from "@/lib/access-reviews/access-report-service";

export default async function AccessFeedPage() {
  const reports = await getRecentCommunityFeed({ limit: 30 });

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-8">
      <header>
        <h1 className="text-2xl font-bold">Recent community access reports</h1>
        <p className="text-sm text-muted-foreground">
          Latest user-reported access conditions across MapAble Access.
        </p>
        <Link href="/access/map" className="mt-2 inline-block text-sm underline">
          Browse the access map
        </Link>
      </header>
      <CommunityReportsFeed
        items={reports.map((r) => ({
          id: r.id,
          reportType: r.reportType,
          reviewBody: r.reviewBody,
          createdAt: r.createdAt.toISOString(),
          place: {
            id: r.place.id,
            name: r.place.name,
            suburb: r.place.suburb,
          },
        }))}
      />
    </div>
  );
}
