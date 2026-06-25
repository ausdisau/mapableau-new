import Link from "next/link";

import { AccessBadgeGrid } from "@/components/access-contributions/AccessBadgeGrid";
import { ContributorStats } from "@/components/access-contributions/ContributorStats";
import { SkipToContent } from "@/components/core/SkipToContent";
import { getUserBadges } from "@/lib/access-contributions/badge-service";
import {
  getRecentContributions,
  getUserContributionStats,
} from "@/lib/access-contributions/contribution-service";
import { requireAuth } from "@/lib/auth/guards";

export default async function AccessContributionsPage() {
  const user = await requireAuth();

  const [badges, stats, recent] = await Promise.all([
    getUserBadges(user.id),
    getUserContributionStats(user.id),
    getRecentContributions(user.id),
  ]);

  return (
    <>
      <SkipToContent />
      <main id="main-content" className="mx-auto max-w-3xl space-y-8 px-4 py-8">
        <nav className="text-sm">
          <Link href="/dashboard" className="underline">
            Back to dashboard
          </Link>
        </nav>
        <h1 className="text-2xl font-bold">Your Access contributions</h1>
        <ContributorStats stats={stats} />
        <section aria-labelledby="badges-heading">
          <h2 id="badges-heading" className="text-lg font-semibold">
            Badges
          </h2>
          <div className="mt-3">
            <AccessBadgeGrid
              badges={badges.map((b) => ({
                code: b.badge.code,
                title: b.badge.title,
                description: b.badge.description,
                earnedAt: b.earnedAt.toISOString(),
              }))}
            />
          </div>
        </section>
        <section aria-labelledby="recent-heading">
          <h2 id="recent-heading" className="text-lg font-semibold">
            Recent activity
          </h2>
          <ul className="mt-3 space-y-2 text-sm">
            {recent.map((c) => (
              <li key={c.id}>
                {c.action.replace(/_/g, " ")} ·{" "}
                {new Date(c.createdAt).toLocaleDateString("en-AU")}
              </li>
            ))}
          </ul>
        </section>
      </main>
    </>
  );
}
