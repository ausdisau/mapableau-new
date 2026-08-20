import Link from "next/link";

import { requireAdmin } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";

export default async function AdminAdsCampaignsPage() {
  await requireAdmin();

  const campaigns = await prisma.adCampaign
    .findMany({
      orderBy: { updatedAt: "desc" },
      take: 100,
      include: { advertiser: true },
    })
    .catch(() => []);

  return (
    <div className="mx-auto max-w-5xl space-y-4 p-8">
      <Link href="/admin/ads" className="text-sm text-primary underline">
        ← Ads ops
      </Link>
      <h1 className="text-2xl font-bold">Campaigns</h1>
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b">
            <th className="py-2">Name</th>
            <th>Advertiser</th>
            <th>Status</th>
            <th>House</th>
            <th>Priority</th>
          </tr>
        </thead>
        <tbody>
          {campaigns.map((c) => (
            <tr key={c.id} className="border-b border-border/60">
              <td className="py-2">{c.name}</td>
              <td>{c.advertiser.name}</td>
              <td>{c.status}</td>
              <td>{c.isHouse ? "yes" : "no"}</td>
              <td>{c.priority}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
