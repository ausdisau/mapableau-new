import Link from "next/link";

import { requireAdmin } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";

export default async function AdminAdsCreativesPage() {
  await requireAdmin();

  const creatives = await prisma.adCreative
    .findMany({
      orderBy: { updatedAt: "desc" },
      take: 100,
      include: { campaign: true },
    })
    .catch(() => []);

  return (
    <div className="mx-auto max-w-5xl space-y-4 p-8">
      <Link href="/admin/ads" className="text-sm text-primary underline">
        ← Ads ops
      </Link>
      <h1 className="text-2xl font-bold">Creatives</h1>
      <p className="text-sm text-muted-foreground">
        Creatives cannot go DRAFT → ACTIVE. Path: DRAFT → PENDING_REVIEW →
        APPROVED → ACTIVE. Claim flags require human review.
      </p>
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b">
            <th className="py-2">Headline</th>
            <th>Campaign</th>
            <th>Status</th>
            <th>Claim flags</th>
          </tr>
        </thead>
        <tbody>
          {creatives.map((c) => (
            <tr key={c.id} className="border-b border-border/60">
              <td className="py-2">{c.headline}</td>
              <td>{c.campaign.name}</td>
              <td>{c.status}</td>
              <td>{c.claimFlags.join(", ") || "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
