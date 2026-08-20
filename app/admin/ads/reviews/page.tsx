import Link from "next/link";

import { AdminReviewActions } from "@/components/ads/admin/AdminReviewActions";
import { requireAdmin } from "@/lib/auth/guards";
import { listPendingReviews } from "@/lib/ads/services/admin-review-service";
import { prisma } from "@/lib/prisma";

export default async function AdminAdsReviewsPage() {
  await requireAdmin();

  const [pending, approved] = await Promise.all([
    listPendingReviews().catch(() => []),
    prisma.adCreative
      .findMany({
        where: { status: "APPROVED" },
        orderBy: { updatedAt: "desc" },
        take: 50,
        include: {
          campaign: { include: { advertiser: true } },
          policyReviews: { orderBy: { createdAt: "desc" }, take: 1 },
        },
      })
      .catch(() => []),
  ]);

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-8">
      <Link href="/admin/ads" className="text-sm text-primary underline">
        ← Ads ops
      </Link>
      <header>
        <h1 className="text-2xl font-bold">Creative review queue</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Human vetting only. Claim-flagged creatives must not be auto-approved.
          Path: PENDING_REVIEW → APPROVED → ACTIVE (ops).
        </p>
      </header>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">
          Pending review ({pending.length})
        </h2>
        {pending.length === 0 ? (
          <p className="text-sm text-muted-foreground">No creatives waiting.</p>
        ) : (
          pending.map((c) => (
            <article
              key={c.id}
              className="rounded-lg border border-border p-4"
            >
              <p className="text-xs text-muted-foreground">
                {c.campaign.advertiser.name} · {c.campaign.name}
              </p>
              <h3 className="mt-1 font-semibold">{c.headline}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{c.body}</p>
              <p className="mt-2 text-sm">
                Destination:{" "}
                <a
                  href={c.destinationUrl}
                  className="text-primary underline"
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  {c.destinationUrl}
                </a>
              </p>
              {c.claimFlags.length > 0 ? (
                <p className="mt-2 text-sm text-amber-700 dark:text-amber-300">
                  Claim flags: {c.claimFlags.join(", ")}
                </p>
              ) : (
                <p className="mt-2 text-sm text-muted-foreground">
                  No claim flags
                </p>
              )}
              <AdminReviewActions
                creative={{
                  id: c.id,
                  headline: c.headline,
                  body: c.body,
                  destinationUrl: c.destinationUrl,
                  claimFlags: c.claimFlags,
                  status: c.status,
                  campaign: {
                    id: c.campaign.id,
                    name: c.campaign.name,
                    advertiser: {
                      id: c.campaign.advertiser.id,
                      name: c.campaign.advertiser.name,
                    },
                  },
                }}
              />
            </article>
          ))
        )}
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">
          Approved — awaiting activate ({approved.length})
        </h2>
        {approved.map((c) => (
          <article key={c.id} className="rounded-lg border border-border p-4">
            <h3 className="font-semibold">{c.headline}</h3>
            <p className="text-sm text-muted-foreground">
              {c.campaign.advertiser.name}
            </p>
            <AdminReviewActions
              creative={{
                id: c.id,
                headline: c.headline,
                body: c.body,
                destinationUrl: c.destinationUrl,
                claimFlags: c.claimFlags,
                status: c.status,
                campaign: {
                  id: c.campaign.id,
                  name: c.campaign.name,
                  advertiser: {
                    id: c.campaign.advertiser.id,
                    name: c.campaign.advertiser.name,
                  },
                },
              }}
            />
          </article>
        ))}
      </section>
    </div>
  );
}
